import React, { useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
import { io } from 'socket.io-client'; // 🟢 ADD: Socket.IO client
import {
    PhoneIcon,
    PhoneXMarkIcon,
    EllipsisHorizontalIcon,
    XMarkIcon,
    ExclamationCircleIcon,
    SpeakerWaveIcon, // Not used but kept for controls
    SpeakerXMarkIcon, // Not used but kept for controls
    MicrophoneIcon,
    NoSymbolIcon,
    ArrowPathIcon 
} from "@heroicons/react/24/solid";

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66; 

// 🟢 ADD: Socket.IO connection
const socket = io('http://localhost:3001');


// Helper for formatting duration
const formatDuration = (totalSeconds) => {
    // Ensures time is displayed as M:SS
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
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1.0); // volume state kept, but volume setting logic omitted for simplicity

    const deviceRef = useRef(null);
    const callTimerRef = useRef(null);

    const keypad = [
        ["1", ""], ["2", "ABC"], ["3", "DEF"],
        ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
        ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
        ["*", ""], ["0", ""], ["#", ""],
    ];

    // Status mapping helper function for display
    const mapStatusForDisplay = (status) => {
        if (status === 'completed') return 'accepted';
        if (status === 'initiated') return 'ringing';
        return status;
    };


    // 1. Fetch recent calls
    const fetchRecentCalls = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/call-logs`);
            const data = await response.json();
            
            const processedCalls = data.map(call => ({
                ...call,
                status: mapStatusForDisplay(call.status)
            }));

            setRecentCalls(processedCalls || []);
        } catch (err) {
            console.error("Fetch call logs error:", err);
            setRecentCalls([]);
        }
    };

    // 2. Call log finalization and refresh
    const finalizeCallLog = async (callSid) => {
        if (!callSid) return;
        try {
            // Backend को कॉल करें ताकि Twilio REST API से अंतिम स्थिति प्राप्त हो
            await fetch(`${API_BASE_URL}/call/status/${callSid}`);
            // Call log refresh करें
            fetchRecentCalls();
        } catch (error) {
            console.error("Error finalizing call log:", error);
            fetchRecentCalls();
        }
    };


    // 3. Setup Call Event Handlers (Called for both Outgoing and Incoming calls)
    const setupCallHandlers = (call) => {
        setActiveCall(call);
        setCallTimer(0);
        
        // Incoming CallSid is often available immediately from the object
        const currentCallSid = call.sid || call.parameters.CallSid;

        call.on('accept', () => {
            console.log('📞 Call accepted');
            setMessage({ text: 'Call connected! You can now talk.', type: 'success' });
            call.mute(false);

            const startTime = Date.now();
            callTimerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setCallTimer(elapsed);
            }, 1000);
        });

        call.on('disconnect', () => {
            console.log('📞 Call disconnected');
            setActiveCall(null);
            setCallTimer(0);
            setIsMuted(false);

            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
            }

            setMessage({ text: 'Call ended', type: 'info' });

            if (currentCallSid) {
                finalizeCallLog(currentCallSid);
            } else {
                fetchRecentCalls();
            }
        });

        call.on('cancel', () => {
            console.log('📞 Call cancelled');
            setActiveCall(null);
            setMessage({ text: 'Call cancelled', type: 'info' });
            finalizeCallLog(currentCallSid);
        });

        call.on('reject', () => {
            console.log('📞 Call rejected');
            setActiveCall(null);
            setMessage({ text: 'Call rejected', type: 'error' });
            finalizeCallLog(currentCallSid);
        });

        call.on('error', (error) => {
            console.error('❌ Call error:', error);
            setActiveCall(null);
            setMessage({ text: `Call error: ${error.message}`, type: 'error' });
            finalizeCallLog(currentCallSid);
        });
    };


    // 4. Device Initialization (The Core Logic)
    useEffect(() => {
        const initializeDevice = async () => {
            try {
                setMessage({ text: 'Initializing voice connection...', type: 'info' });

                // Get access token
                const response = await fetch(`${API_BASE_URL}/token`);
                const data = await response.json();

                if (!data || !data.success) {
                    throw new Error(data?.message || 'Failed to get access token.');
                }

                setToken(data.token);

                // Create and setup device
                const newDevice = new Device(data.token, {
                    logLevel: 1,
                    codecPreferences: ['opus', 'pcmu'],
                    allowIncomingWhileBusy: true, 
                    enableRingingState: true,
                    sounds: {
                        disconnect: false,
                        incoming: false,
                        outgoing: false
                    }
                });

                deviceRef.current = newDevice;
                setDevice(newDevice);

                // Device event listeners (Critical for connection and receiving)
                newDevice.on('ready', () => {
                    console.log('✅ Twilio Device Ready');
                    setIsDeviceReady(true);
                    setMessage({ text: 'Voice connection ready! You can now make calls.', type: 'success' });
                    setTimeout(() => { setMessage({ text: '', type: '' }); }, 3000);
                });

                newDevice.on('error', (error) => {
                    console.error('❌ Device Error:', error);
                    setMessage({ text: `Device error: ${error.message}`, type: 'error' });
                    setIsDeviceReady(false);
                });

                // 🟢 INCOMING CALL HANDLING (RECEIVE FIX)
                newDevice.on('incoming', (call) => {
                    console.log('📞 Incoming call from:', call.parameters.From);
                    setMessage({ text: `Incoming call from ${call.parameters.From}`, type: 'info' });
                    
                    // Call को तुरंत स्वीकार करें (या यूजर से प्रॉम्प्ट करें)
                    call.accept();
                    
                    // Call handlers सेट करें
                    setupCallHandlers(call);
                });
                // ------------------------------------

                // Register device
                await newDevice.register();

            } catch (error) {
                console.error('❌ Device initialization failed:', error);
                const errorMessage = error?.message || 'Unknown error during device initialization.';
                setMessage({ text: `Failed to initialize: ${errorMessage}`, type: 'error' });
                setIsDeviceReady(false);
            }
        };

        initializeDevice();

        // Cleanup
        return () => {
            if (deviceRef.current) {
                deviceRef.current.destroy();
            }
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
            }
        };
    }, []);

    // Initial fetch of recent calls
    useEffect(() => {
        fetchRecentCalls();
    }, []);

    // 🟢 FIX: Listen for real-time call status updates from the socket.
    // This is the key to fixing the "stuck on ringing" issue.
    useEffect(() => {
        const handleCallUpdate = (callData) => {
            console.log('Socket: Received call status update', callData);
            fetchRecentCalls(); // Refresh the list when an update is received
        };
        socket.on('call_status_update', handleCallUpdate);
        return () => socket.off('call_status_update', handleCallUpdate);
    }, []); // Empty dependency array ensures this runs only once.

    // Make a call (Updated to accept number override)
    const handleCall = async (numberOverride = null) => {
        const number = numberOverride || dialNumber;

        if (!isDeviceReady || !device) {
            setMessage({ text: 'Device not ready. Please wait...', type: 'error' });
            return;
        }

        const fullNumber = numberOverride || `${countryCode}${dialNumber}`;
        
        if (fullNumber.replace(/[^0-9+]/g, '').length < 10) {
            setMessage({ text: 'Enter a valid phone number (min 10 digits).', type: 'error' });
            return;
        }
        
        // Request microphone permission (Best practice)
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            setMessage({ text: 'Microphone permission required for calls', type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: `Connecting call to ${fullNumber}...`, type: 'info' });

        try {
            console.log('📞 Making call to:', fullNumber);

            const call = await device.connect({
                params: {
                    To: fullNumber
                }
            });

            setupCallHandlers(call);
            setDialNumber('');

        } catch (error) {
            console.error('❌ Call failed:', error);
            setMessage({ text: `Call failed: ${error.message}`, type: 'error' });
            setActiveCall(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Redial action from the recent log panel
    const handleRedial = (phoneNumber) => {
        if (phoneNumber) {
            // Twilio calls expect E.164 format (e.g., +91...)
            // We assume log provides E.164, so pass it directly.
            handleCall(phoneNumber); 
        }
    };


    // Hang up call (Unchanged)
    const handleHangup = () => {
        if (activeCall) {
            activeCall.disconnect();
        }
    };

    // Mute/unmute (Unchanged)
    const toggleMute = () => {
        if (activeCall) {
            activeCall.mute(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    // Send DTMF tones during call (Unchanged)
    const sendDTMF = (digit) => {
        if (activeCall) {
            activeCall.sendDigits(digit);
            console.log('📞 Sent DTMF:', digit);
        } else {
            // Add to dial number if not in call
            if (dialNumber.length < 15) {
                setDialNumber(prev => prev + digit);
            }
        }
    };

    // Keypad click handler (Unchanged)
    const handleKeypadClick = (num) => {
        sendDTMF(num);
    };

    const handleBackspace = () => {
        if (!activeCall) {
            setDialNumber(prev => prev.slice(0, -1));
        }
    };

    // Status indicator for recent calls panel
    const getIndicatorColor = (status) => {
        if (status?.includes('accepted')) return 'bg-green-500';
        if (status?.includes('failed') || status?.includes('no-answer') || status?.includes('busy') || status?.includes('rejected') || status?.includes('canceled')) return 'bg-red-500';
        if (status?.includes('ringing') || status?.includes('initiated')) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const messageStyles = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700',
    };

    return (
        <div 
            className="p-8 font-inter flex-grow overflow-y-auto"
            style={{ 
                height: '100vh', 
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`, 
                backgroundColor: 'var(--bg-gray-50, #f9fafb)' 
            }}
        >
            <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Phone Dialer</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-inter">

                {/* Left Panel */}
                <div className="lg:col-span-2 flex flex-col items-center">

                    {/* Status Message */}
                    {message.text && (
                        <div className={`w-full max-w-md p-3 mb-4 border-l-4 rounded-md shadow-md ${messageStyles[message.type] || ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                    {message.type === 'error' && <ExclamationCircleIcon className="w-5 h-5 mr-2" />}
                                    <p className="font-medium text-sm">{message.text}</p>
                                </div>
                                <button onClick={() => setMessage({ text: '', type: '' })}>
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Device Status */}
                    <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-md mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-600 font-semibold">Voice Connection</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isDeviceReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-sm font-medium ${isDeviceReady ? 'text-green-600' : 'text-red-600'}`}>
                                    {isDeviceReady ? 'Ready' : 'Connecting...'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch(`${API_BASE_URL}/test-twilio`);
                                    const data = await response.json();
                                    setMessage({
                                        text: data.success ? 'Twilio connection test passed!' : `Test failed: ${data.message}`,
                                        type: data.success ? 'success' : 'error'
                                    });
                                } catch (error) {
                                    setMessage({ text: `Connection test failed: ${error.message}`, type: 'error' });
                                }
                            }}
                            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                            Test Connection
                        </button>
                    </div>

                    {/* Dialer Input */}
                    <div className="bg-white shadow-xl rounded-xl p-6 w-full max-w-md">
                        <label className="block text-gray-600 font-semibold mb-1">Real-Time Voice Call</label>

                        <div className="flex items-center gap-2 mb-4">
                            <select
                                className="border rounded-lg px-2 py-2 focus:ring-2 focus:ring-pink-500"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                disabled={!!activeCall}
                            >
                                <option value="+91">+91 (India)</option>
                                <option value="+1">+1 (US/Canada)</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Enter phone number"
                                className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-green-500 font-mono text-lg"
                                value={dialNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setDialNumber(val);
                                }}
                                maxLength={15}
                                disabled={!!activeCall}
                            />
                        </div>

                        {/* Call Controls during active call */}
                        {activeCall && (
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-green-600">
                                        <div className="font-mono text-lg">{formatDuration(callTimer)}</div>
                                        <div className="text-xs">Connected</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={toggleMute}
                                        className={`p-2 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        {isMuted ? <NoSymbolIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className={`text-xs ${dialNumber.length < 10 && !activeCall ? 'text-red-500' : 'text-green-600 font-medium'}`}>
                            {activeCall ? 'Use keypad to send tones' : `${dialNumber.length} / 10+ digits`}
                        </p>
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        {keypad.map(([num, letters]) => (
                            <button
                                key={num}
                                className="bg-white w-20 h-20 rounded-full shadow-lg flex flex-col items-center justify-center text-2xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                onClick={() => handleKeypadClick(num)}
                                disabled={isLoading || (!activeCall && dialNumber.length >= 15)}
                            >
                                <span className='font-bold'>{num}</span>
                                <span className="text-xs text-gray-400">{letters}</span>
                            </button>
                        ))}
                    </div>

                    {/* Call Controls */}
                    <div className="flex gap-12 mt-10 items-center">
                        <button
                            onClick={handleBackspace}
                            className="bg-gray-200 w-14 h-14 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                            disabled={!!activeCall}
                        >
                            <PhoneXMarkIcon className="w-7 h-7 rotate-90" />
                        </button>

                        <button
                            onClick={activeCall ? handleHangup : () => handleCall()}
                            className={`text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl disabled:bg-gray-400 transition-colors
                                ${activeCall ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                            disabled={isLoading || (!activeCall && (dialNumber.length < 10 || !isDeviceReady))}
                        >
                            {activeCall ? (
                                <div className='flex flex-col items-center text-xs font-semibold'>
                                    <PhoneXMarkIcon className="w-8 h-8 mb-1" />
                                    <span className="text-xs">End Call</span>
                                </div>
                            ) : isLoading ? (
                                <div className="animate-spin h-8 w-8 border-b-2 border-white rounded-full"></div>
                            ) : (
                                <PhoneIcon className="w-10 h-10" />
                            )}
                        </button>

                        <button className="bg-gray-200 w-14 h-14 rounded-full flex items-center justify-center hover:bg-gray-300">
                            <EllipsisHorizontalIcon className="w-7 h-7" />
                        </button>
                    </div>
                </div>

                {/* Right Panel - Recent Calls (Scrollable Log Panel) */}
                <div className="bg-white shadow-xl rounded-xl p-6 h-full lg:col-span-1 flex flex-col">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-pink-500 border-b-2 pb-3 mb-4 flex-none">
                        <PhoneIcon className="w-6 h-6" /> Recent Calls
                    </h3>
                    
                    {/* Log Area - Internal Scroll */}
                    <div className="mt-4 space-y-3 flex-1 overflow-y-auto pr-2">
                        {recentCalls.length === 0 ? (
                            <p className="text-center text-gray-500 pt-10">No recent calls found.</p>
                        ) : recentCalls.map((call, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${getIndicatorColor(call.status)}`}></span>
                                    <div className='text-sm'>
                                        <p className='font-semibold'>{call.to_number || call.number}</p>
                                        <p className='text-xs text-gray-500'>
                                            {call.status.toUpperCase()} - {new Date(call.start_time).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => handleRedial(call.to_number || call.number)}
                                    disabled={!isDeviceReady || !!activeCall || isLoading}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
                                    title="Redial"
                                >
                                    <PhoneIcon className="w-5 h-5 text-indigo-600" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* 💡 Refresh Button for Logs */}
                    <div className='mt-4 pt-4 border-t flex-none'>
                        <button
                            onClick={fetchRecentCalls}
                            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center justify-center"
                        >
                            <ArrowPathIcon className="w-4 h-4 mr-2" /> Refresh Log
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealTimeDialer;