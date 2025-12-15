import React, { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import { io } from 'socket.io-client';
import '../styles/animations.css';
import {
    PhoneIcon,
    PhoneXMarkIcon,
    EllipsisHorizontalIcon,
    XMarkIcon,
    ExclamationCircleIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    MicrophoneIcon,
    NoSymbolIcon,
    ArrowPathIcon,
    BellIcon,
    TrashIcon
} from "@heroicons/react/24/solid";
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;
const IDENTITY = 'webuser';
// Recent calls paging
const RECENT_PAGE_SIZE = 5;
const TWILIO_FROM_NUMBER = '+14783393400';

// Socket.IO connection
const socket = io('http://localhost:3001');

const formatDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const RealTimeDialer = () => {
    const [device, setDevice] = useState(null);
    const [token, setToken] = useState(null);
    const [isDeviceReady, setIsDeviceReady] = useState(false);
    const [activeCall, setActiveCall] = useState(null);
    const [callTimer, setCallTimer] = useState(0);
    const [dialNumber, setDialNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [recentCalls, setRecentCalls] = useState([]);
    const [recentFilter, setRecentFilter] = useState('all'); // all | incoming | outgoing
    const [recentPage, setRecentPage] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1.0);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [callLogToDelete, setCallLogToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Incoming Call Modal State
    const [incomingCall, setIncomingCall] = useState(null);
    const [showIncomingModal, setShowIncomingModal] = useState(false);
    const [ringingTimeout, setRingingTimeout] = useState(null);

    const deviceRef = useRef(null);
    const callTimerRef = useRef(null);

    const keypad = [
        ["1", ""], ["2", "ABC"], ["3", "DEF"],
        ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
        ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
        ["*", ""], ["0", ""], ["#", ""],
    ];

    const mapStatusForDisplay = (status) => {
        if (status === 'completed') return 'accepted';
        if (status === 'initiated') return 'ringing';
        if (status === 'no-answer') return 'missed';
        if (status === 'canceled') return 'canceled';
        if (status === 'failed') return 'failed';
        if (status === 'busy') return 'busy';
        return status;
    };

    const fetchRecentCalls = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/call-logs`);
            if (!response.ok) throw new Error('Network error');

            const data = await response.json();

            const processedCalls = data.map(call => {
                const isOutgoing =
                    call.from_number === TWILIO_FROM_NUMBER ||
                    call.from_number?.includes('client:') ||
                    call.from_number?.includes('support_agent');

                return {
                    ...call,
                    status: mapStatusForDisplay(call.status),
                    hasRecording: !!call.recording_url,
                    direction: isOutgoing ? 'outgoing' : 'incoming',
                    displayNumber: isOutgoing ? call.to_number : call.from_number
                };
            });

            setRecentCalls(processedCalls);
        } catch (err) {
            console.error("Fetch call logs error:", err);
            setRecentCalls([]);
        }
    };

    const updateCallStatus = async (sid, status, recordingUrl = null) => {
        if (!sid) return;
        try {
            await fetch(`${API_BASE_URL}/save-call-log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callSid: sid, status, recordingUrl })
            });
            fetchRecentCalls();
        } catch (e) {
            console.error('Save status failed:', e);
        }
    };

    const playRecording = (url) => {
        window.open(url, '_blank');
    };

    const finalizeCallLog = async (callSid) => {
        try {
            const statusResponse = await fetch(`${API_BASE_URL}/call/status/${callSid}`);
            const statusData = await statusResponse.json();
            if (statusData.status) {
                console.log(`Final call status for ${callSid}: ${statusData.status}`);
            }
            fetchRecentCalls();
        } catch (error) {
            console.error("Error finalizing call log:", error);
            fetchRecentCalls();
        }
    };

    // Initialize Twilio Device + Socket.IO
    useEffect(() => {
        const initializeDevice = async () => {
            try {
                setMessage({ text: 'Initializing voice connection...', type: 'info' });

                const healthResponse = await fetch(`${API_BASE_URL}/health`);
                const healthData = await healthResponse.json();
                if (!healthData.services.twilio) throw new Error('Twilio not ready');

                const response = await fetch(`${API_BASE_URL}/token`);
                const data = await response.json();
                if (!data.success) throw new Error(data.message || 'Token error');

                setToken(data.token);

                const newDevice = new Device(data.token, {
                    logLevel: 1,
                    codecPreferences: ['opus', 'pcmu'],
                    allowIncomingWhileBusy: false,
                    enableRingingState: true,
                    sounds: { incoming: false, outgoing: false, disconnect: false },
                    fake: false,
                    enableIceRestart: true
                });

                deviceRef.current = newDevice;
                setDevice(newDevice);

                newDevice.on('ready', () => {
                    console.log('Twilio Device Ready');
                    setIsDeviceReady(true);
                    setMessage({ text: 'Voice ready!', type: 'success' });
                    setTimeout(() => setMessage({}), 3000);
                });

                newDevice.on('error', (error) => {
                    console.error('Device Error:', error);
                    setMessage({ text: `Error: ${error.message}`, type: 'error' });
                    setIsDeviceReady(false);
                });

                newDevice.on('incoming', (call) => {
                    console.log('Incoming call via SDK:', call.parameters.From);
                    handleIncomingCall({
                        sid: call.parameters.CallSid,
                        from: call.parameters.From,
                        to: call.parameters.To || 'You',
                        callInstance: call
                    });
                });

                newDevice.on('tokenWillExpire', async () => {
                    const res = await fetch(`${API_BASE_URL}/token`);
                    const d = await res.json();
                    if (d.success) newDevice.updateToken(d.token);
                });

                await newDevice.register();

                setTimeout(() => {
                    if (!isDeviceReady) setIsDeviceReady(true);
                }, 2000);

            } catch (error) {
                setMessage({ text: `Init failed: ${error?.message || 'Unknown connection error.'}`, type: 'error' });
            }
        };

        initializeDevice();

        return () => {
            if (deviceRef.current) deviceRef.current.destroy();
            if (callTimerRef.current) clearInterval(callTimerRef.current);
            socket.disconnect();
        };
    }, []);

    // Listen for real-time call status updates from the socket
    useEffect(() => {
        const handleCallUpdate = (callData) => {
            console.log('Socket: Received call update', callData);
            fetchRecentCalls();
        };
        socket.on('call_status_update', handleCallUpdate);
        return () => {
            socket.off('call_status_update', handleCallUpdate);
        };
    }, []);

    // SOCKET.IO: Listen for Incoming Call from Backend
    useEffect(() => {
        socket.on('incoming_call_alert', (call) => {
            console.log('Incoming call via Socket.IO:', call);
            handleIncomingCall({
                sid: call.sid,
                from: call.from,
                to: call.to,
                callInstance: null
            });
        });

        return () => socket.off('incoming_call_alert');
    }, []);

    const handleIncomingCall = (callData) => {
        if (activeCall) {
            console.log('Busy, rejecting incoming call');
            fetch(`/api/call/hangup/${callData.sid}`, { method: 'POST' });
            return;
        }

        setIncomingCall(callData);
        setShowIncomingModal(true);

        const timeout = setTimeout(() => {
            handleRejectCall();
        }, 30000);
        setRingingTimeout(timeout);

        playRingtone();
    };

    const playRingtone = () => {
        const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
        audio.loop = true;
        audio.play().catch(() => { });
        window.ringtone = audio;
    };

    const stopRingtone = () => {
        if (window.ringtone) {
            window.ringtone.pause();
            window.ringtone = null;
        }
    };

    const handleAcceptCall = async () => {
        stopRingtone();
        clearTimeout(ringingTimeout);
        setShowIncomingModal(false);

        if (incomingCall.callInstance) {
            incomingCall.callInstance.accept();
            setupCallHandlers(incomingCall.callInstance);
        } else {
            await fetch(`${API_BASE_URL}/twilio/accept-call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callSid: incomingCall.sid })
            });
        }
        setIncomingCall(null);
    };

    const handleRejectCall = async (reason = 'canceled') => {
        stopRingtone();
        clearTimeout(ringingTimeout);
        setShowIncomingModal(false);

        await fetch(`/api/call/hangup/${incomingCall.sid}`, { method: 'POST' });
        await updateCallStatus(incomingCall.sid, reason);
        setMessage({ text: 'Call rejected', type: 'info' });
        setIncomingCall(null);
    };

    const setupCallHandlers = (call) => {
        setActiveCall(call);
        setCallTimer(0);

        const currentCallSid = call.parameters.CallSid || call.sid;

        call.on('accept', () => {
            console.log('Call accepted');
            setMessage({ text: 'Connected!', type: 'success' });
            call.mute(false);

            const startTime = Date.now();
            callTimerRef.current = setInterval(() => {
                setCallTimer(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        });

        call.on('disconnect', async () => {
            endCall(currentCallSid);
        });

        call.on('cancel', () => {
            endCall(currentCallSid);
        });

        call.on('reject', () => {
            endCall(currentCallSid);
        });

        call.on('error', (error) => {
            console.error('Call error:', error);
            endCall(currentCallSid);
        });
    };

    const endCall = (sid) => {
        setActiveCall(null);
        setCallTimer(0);
        setIsMuted(false);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        setMessage({ text: 'Call ended', type: 'info' });
        finalizeCallLog(sid);
    };

    useEffect(() => {
        fetchRecentCalls();
    }, []);

    const handleCall = async (numberOverride = null) => {
        const number = numberOverride || dialNumber;
        if (!isDeviceReady || !device) return setMessage({ text: 'Not ready', type: 'error' });
        if (number.length < 10) return setMessage({ text: '10+ digits', type: 'error' });

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            return setMessage({ text: 'Mic access denied', type: 'error' });
        }

        setIsLoading(true);
        setMessage({ text: 'Dialing...', type: 'info' });

        try {
            const call = await device.connect({ params: { To: number } });
            setupCallHandlers(call);
            setDialNumber('');
        } catch (error) {
            setMessage({ text: `Failed: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedial = (phoneNumber) => {
        if (phoneNumber) {
            const clean = phoneNumber.replace(/^\+\d{1,4}/, '');
            setCountryCode(phoneNumber.match(/^\+(\d{1,4})/)?.[0] || '+91');
            setDialNumber(clean);
            handleCall(phoneNumber);
        }
    };

    const handleHangup = () => activeCall && activeCall.disconnect();
    const toggleMute = () => activeCall && activeCall.mute(!isMuted) && setIsMuted(!isMuted);
    const sendDTMF = (digit) => activeCall?.sendDigits(digit) || setDialNumber(prev => prev + digit);
    const handleKeypadClick = (num) => sendDTMF(num);
    const handleBackspace = () => !activeCall && setDialNumber(prev => prev.slice(0, -1));

    const getIndicatorColor = (status) => {
        if (status?.includes('accepted')) return 'bg-green-500';
        if (/failed|no-answer|busy|rejected|canceled/.test(status)) return 'bg-red-500';
        if (/ringing|initiated/.test(status)) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const handleDeleteCallLog = (call) => {
        setCallLogToDelete(call);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteCallLog = async () => {
        if (!callLogToDelete) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/call-logs/${callLogToDelete._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete call log');
            }

            setMessage({ text: 'Call log deleted successfully', type: 'success' });
            fetchRecentCalls();
            setIsDeleteModalOpen(false);
            setCallLogToDelete(null);
        } catch (error) {
            console.error('Error deleting call log:', error);
            setMessage({ text: 'Failed to delete call log', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const messageStyles = {
        success: 'bg-emerald-50 border border-emerald-300 text-emerald-800',
        error: 'bg-rose-50 border border-rose-300 text-rose-800',
        info: 'bg-sky-50 border border-sky-300 text-sky-800',
    };

    return (
        <div
            className="relative h-screen font-inter overflow-hidden text-gray-800 dark:text-gray-200 page-transition-enter page-transition-enter-active bg-[#FDF8F9] dark:bg-gray-900"
            style={{
                paddingTop: `${NAVBAR_HEIGHT_PX}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`,
            }}
        >
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-purple-200/50 blur-[120px]" />
                <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-pink-200/50 blur-[120px]" />
                <div className="absolute bottom-0 right-20 w-[300px] h-[300px] bg-rose-200/50 blur-[120px]" />
            </div>

            {message.text && (
                <div className={`fixed top-6 right-6 z-50 rounded-2xl backdrop-blur-md px-5 py-3 flex items-center gap-3 shadow-lg ${messageStyles[message.type]} dark:bg-gray-800`}>
                    {message.type === 'error' && <ExclamationCircleIcon className="w-5 h-5" />}
                    <span className="text-sm font-semibold">{message.text}</span>
                    <button onClick={() => setMessage({})}>
                        <XMarkIcon className="w-4 h-4 text-gray-500 hover:text-gray-800" />
                    </button>
                </div>
            )}

            <div className="relative z-10 h-full flex flex-col gap-4 px-4 sm:px-6 lg:px-10 py-6">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/50 bg-white/60 dark:bg-gray-800/60 dark:border-gray-700 px-6 py-4 shadow-sm backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-5 py-2.5">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-400 mb-0.5">Dialer</p>
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">Compact Studio</p>
                        </div>
                        <button
                            onClick={async () => {
                                const res = await fetch(`${API_BASE_URL}/test-twilio`);
                                const d = await res.json();
                                setMessage({ text: d.success ? 'Test passed!' : d.message, type: d.success ? 'success' : 'error' });
                            }}
                            className="text-[10px] uppercase tracking-[0.2em] bg-gray-50 dark:bg-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-100 dark:border-gray-600 font-medium text-gray-600 dark:text-gray-300"
                        >
                            Health Check
                        </button>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 rounded-full border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-xs font-medium shadow-sm">
                            <span className={`w-2 h-2 rounded-full ${isDeviceReady ? 'bg-yellow-400' : 'bg-gray-300'} ${!isDeviceReady && 'animate-pulse'}`} />
                            {isDeviceReady ? 'Connected' : 'Connecting...'}
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-xs font-medium shadow-sm">
                            <SpeakerWaveIcon className="w-4 h-4 text-gray-400" />
                            {activeCall ? `Live ${formatDuration(callTimer)}` : 'Idle'}
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-6 overflow-hidden text-gray-800">
                    <div className="grid lg:grid-cols-2 gap-6 h-full ">
                        {/* Number Panel */}
                        <div className="rounded-[32px] border border-white/60 bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 backdrop-blur-xl p-6 flex flex-col shadow-sm">
                            <div className="flex items-center justify-between gap-3 mb-6">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-400 mb-1">Number</p>
                                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">Real-time call</p>
                                </div>
                                <select
                                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-200 outline-none"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    disabled={!!activeCall}
                                >
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                </select>
                            </div>

                            <div className="mt-2 flex flex-col gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter phone number"
                                    className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl px-5 py-5 text-xl font-mono tracking-widest placeholder:text-gray-300 focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                                    value={dialNumber}
                                    onChange={(e) => setDialNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                    maxLength={10}
                                    disabled={!!activeCall}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={activeCall ? handleHangup : () => handleCall()}
                                        className={`flex-1 rounded-2xl py-4 text-sm font-bold tracking-wide transition-all shadow-sm ${activeCall
                                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                                                : 'bg-rose-100 hover:bg-rose-200 text-rose-900 shadow-rose-100'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        disabled={isLoading || (!activeCall && (dialNumber.length < 10 || !isDeviceReady))}
                                    >
                                        {activeCall ? 'End Call' : isLoading ? 'Dialing…' : 'Start Call'}
                                    </button>
                                    <button
                                        onClick={handleBackspace}
                                        className="w-16 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-40"
                                        disabled={!!activeCall}
                                    >
                                        <PhoneXMarkIcon className="w-5 h-5 text-gray-400 rotate-90" />
                                    </button>
                                </div>
                                <p className={`text-[11px] font-medium pl-2 ${dialNumber.length < 10 && !activeCall ? 'text-rose-400' : 'text-emerald-500'}`}>
                                    {activeCall ? 'Send tones via keypad' : `${dialNumber.length} / 10+ digits`}
                                </p>
                            </div>

                            {activeCall && (
                                <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-5 py-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-400 mb-1">Connected</p>
                                        <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{formatDuration(callTimer)}</p>
                                    </div>
                                    <button
                                        onClick={toggleMute}
                                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${isMuted
                                                ? 'bg-red-50 border-red-100 text-red-500'
                                                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        {isMuted ? <NoSymbolIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Keypad Panel */}
                        <div className="rounded-[32px] border border-white/60 bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 backdrop-blur-xl p-6 flex flex-col shadow-sm">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-400 mb-5">Keypad</p>
                            <div className="flex-1 grid grid-cols-3 gap-3">
                                {keypad.map(([num, letters]) => (
                                    <button
                                        key={num}
                                        className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 disabled:opacity-40 group"
                                        onClick={() => handleKeypadClick(num)}
                                        disabled={isLoading || (!activeCall && dialNumber.length >= 15)}
                                    >
                                        <span className="text-xl font-semibold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">{num}</span>
                                        <span className="text-[9px] tracking-[0.2em] text-gray-400 group-hover:text-rose-400 transition-colors">{letters}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button className="flex-1 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-xs font-semibold text-gray-500 py-3 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                    <EllipsisHorizontalIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleHangup}
                                    className="flex-1 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-xs font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-red-100 transition-colors"
                                    disabled={!activeCall}
                                >
                                    <PhoneXMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Calls Panel */}
                    <div className="rounded-[32px] border border-white/60 bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 backdrop-blur-xl p-6 flex flex-col h-full shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-400 mb-1">Recent</p>
                                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                    <PhoneIcon className="w-5 h-5 text-gray-800 dark:text-gray-100" /> Calls
                                </h3>
                            </div>
                            <select
                                value={recentFilter}
                                onChange={(e) => { setRecentFilter(e.target.value); setRecentPage(1); }}
                                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-rose-200 outline-none"
                            >
                                <option value="all">All</option>
                                <option value="incoming">Incoming</option>
                                <option value="outgoing">Outgoing</option>
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {(() => {
                                if (!recentCalls || recentCalls.length === 0) {
                                    return <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                        <PhoneIcon className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-xs">No recent calls</p>
                                    </div>;
                                }

                                const filtered = recentCalls.filter(c => {
                                    if (recentFilter === 'incoming') return !!c.is_incoming || !!c.isIncoming || (c.direction === 'inbound');
                                    if (recentFilter === 'outgoing') return !c.is_incoming && !c.isIncoming && (c.direction !== 'inbound');
                                    return true;
                                });

                                const totalPages = Math.max(1, Math.ceil(filtered.length / RECENT_PAGE_SIZE));
                                const start = (recentPage - 1) * RECENT_PAGE_SIZE;
                                const pageItems = filtered.slice(start, start + RECENT_PAGE_SIZE);

                                return (
                                    <div className="space-y-3">
                                        {pageItems.map((call, idx) => (
                                            <div
                                                key={start + idx}
                                                className="group rounded-2xl bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-4 py-3 flex items-center justify-between hover:shadow-md hover:border-rose-100 dark:hover:border-gray-500 transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ${getIndicatorColor(call.status)}`} />
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{call.to_number || call.number}</p>
                                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-0.5">
                                                            {call.status} · {formatDuration(call.duration || 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {call.hasRecording && (
                                                        <button
                                                            onClick={() => playRecording(call.recording_url)}
                                                            className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                                                            title="Play Recording"
                                                        >
                                                            <SpeakerWaveIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRedial(call.to_number || call.number)}
                                                        disabled={!isDeviceReady || !!activeCall}
                                                        className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                    >
                                                        Redial
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCallLog(call)}
                                                        className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                                                        title="Delete Log"
                                                    >
                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 pt-4 px-2">
                                            <span>Page {recentPage} of {Math.max(1, Math.ceil(filtered.length / RECENT_PAGE_SIZE))}</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setRecentPage(p => Math.max(1, p - 1))}
                                                    className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                                                    disabled={recentPage <= 1}
                                                >
                                                    Prev
                                                </button>
                                                <button
                                                    onClick={() => setRecentPage(p => Math.min(Math.max(1, Math.ceil(filtered.length / RECENT_PAGE_SIZE)), p + 1))}
                                                    className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                                                    disabled={recentPage >= Math.max(1, Math.ceil(filtered.length / RECENT_PAGE_SIZE))}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteCallLog}
                title="Delete Call Log"
                message="Are you sure you want to delete this call log? This action cannot be undone."
                isDeleting={isSubmitting}
            />

            {/* Incoming Call Modal */}
            {showIncomingModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl p-8 max-w-sm w-full relative overflow-hidden ring-4 ring-white/20">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-rose-200/50 blur-[80px]" />
                            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-200/50 blur-[80px]" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                            <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner">
                                <PhoneIcon className="w-8 h-8 text-gray-400 animate-pulse" />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Incoming Call</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{incomingCall?.from || 'Unknown'}</p>
                                <p className="text-sm text-rose-500 font-medium animate-pulse">Ringing...</p>
                            </div>

                            <div className="flex gap-6 w-full justify-center">
                                <button
                                    onClick={handleRejectCall}
                                    className="flex-1 py-4 rounded-2xl bg-red-50 text-red-500 font-bold hover:bg-red-100 transition-colors flex flex-col items-center gap-1"
                                >
                                    <PhoneXMarkIcon className="w-6 h-6" />
                                    <span className="text-[10px] uppercase tracking-wider">Decline</span>
                                </button>
                                <button
                                    onClick={handleAcceptCall}
                                    className="flex-1 py-4 rounded-2xl bg-emerald-400 text-white font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-200 transition-all flex flex-col items-center gap-1"
                                >
                                    <PhoneIcon className="w-6 h-6" />
                                    <span className="text-[10px] uppercase tracking-wider">Accept</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RealTimeDialer;