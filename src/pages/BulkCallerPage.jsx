import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { Device } from '@twilio/voice-sdk';
import {
    PhoneIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    MegaphoneIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    DocumentArrowUpIcon,
    UserIcon,
    ClockIcon,
    GlobeAltIcon,
    ChatBubbleBottomCenterTextIcon,
    PhoneArrowUpRightIcon,
    MusicalNoteIcon,
    MicrophoneIcon
} from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;

// --- Helper Functions ---
const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeTwilioNumbers = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        return item.phoneNumber || item.number || item.value || item.friendlyName || item.sid || JSON.stringify(item);
    }).filter(Boolean);
};

const COUNTRY_CODES = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+86', country: 'China' },
    { code: '+971', country: 'UAE' },
];

const BulkCallerPage = () => {
    // --- State Management ---
    const [campaignTitle, setCampaignTitle] = useState('');

    // Twilio States
    const [selectedTwilioNumber, setSelectedTwilioNumber] = useState('');
    const [availableTwilioNumbers, setAvailableTwilioNumbers] = useState([]);
    const [twilioError, setTwilioError] = useState(null);

    // CSV & Queue States
    const [countryCode, setCountryCode] = useState('+91'); // Default to India
    const [csvFile, setCsvFile] = useState(null);
    const [callQueue, setCallQueue] = useState([]); // Array of { name, phone, status }
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isCalling, setIsCalling] = useState(false);
    const [callDelay, setCallDelay] = useState(5); // Seconds between calls
    const [completedCount, setCompletedCount] = useState(0);
    const [recordCall, setRecordCall] = useState(true); // Default to true as per user request
    const [enableSounds, setEnableSounds] = useState(true); // Dashboard sound effects
    const [isPowerDialer, setIsPowerDialer] = useState(false); // Toggle for Power Dialer Mode
    const [isDirectCallMode, setIsDirectCallMode] = useState(false); // Toggle for Direct Real-Time Calling (No IVR)
    const [activeCallParams, setActiveCallParams] = useState(null); // Store active softphone call object
    const [currentCallDuration, setCurrentCallDuration] = useState(0);

    // IVR Content States
    const [introMessage, setIntroMessage] = useState('Hello. Press 1 for English AI. Press 2 for Hindi AI. Press 3 for Agent. Press 4 to Forward. Press 5 for Direct Call.');
    const [ttsMessage, setTtsMessage] = useState('');
    const [forwardingNumber, setForwardingNumber] = useState('');
    const [agentNumber, setAgentNumber] = useState('');
    const [holdMusicUrl, setHoldMusicUrl] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // History Handling
    const [historyLogs, setHistoryLogs] = useState([]);

    // Refs for timer management
    const timerRef = useRef(null);
    const isCallingRef = useRef(isCalling);

    // --- Softphone States ---
    const [device, setDevice] = useState(null);
    const [isDeviceReady, setIsDeviceReady] = useState(false);
    const [manualNumber, setManualNumber] = useState('');
    const [isOnCall, setIsOnCall] = useState(false);
    const [softphoneStatus, setSoftphoneStatus] = useState('Initializing...');

    useEffect(() => {
        isCallingRef.current = isCalling;
    }, [isCalling]);

    // --- Sound Effects Helper ---
    const playFeedbackSound = (type) => {
        if (!enableSounds) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'dialing') {
                // 🟢 UPDATED: Louder and longer "Standard Ring" simulation (440Hz + 480Hz)
                const osc2 = ctx.createOscillator(); // Second oscillator for dual-tone

                osc.type = 'sine';
                osc2.type = 'sine';

                osc.frequency.setValueAtTime(440, now);
                osc2.frequency.setValueAtTime(480, now);

                // Connect second oscillator
                osc2.connect(gain);

                // Increase Volume (Gain from 0.1 to 0.5)
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.linearRampToValueAtTime(0.3, now + 2.0); // 2 seconds fade out

                osc.start(now);
                osc2.start(now);

                // Play for 2 seconds to simulate a "Ring"
                osc.stop(now + 2.0);
                osc2.stop(now + 2.0);

            } else if (type === 'success') {
                // Ascending chime - clear & pleasant
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.linearRampToValueAtTime(1000, now + 0.3);
                gain.gain.setValueAtTime(0.3, now); // Increased volume
                gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);

            } else if (type === 'error') {
                // Low buzz - distinct
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.4, now); // Increased volume
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    // --- Data Fetching ---
    useEffect(() => {
        const fetchTwilioNumbers = async () => {
            setTwilioError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/from-numbers`, { headers: getAuthHeaders() });
                const raw = response.data?.numbers ?? response.data ?? [];
                const numbers = normalizeTwilioNumbers(raw);

                setAvailableTwilioNumbers(numbers);
                if (numbers.length > 0) {
                    setSelectedTwilioNumber(numbers[0]);
                } else {
                    setTwilioError("No sender numbers found. Please check backend config.");
                }
            } catch (err) {
                console.error("Failed to fetch Twilio numbers:", err);
                setTwilioError("Failed to load Twilio numbers.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTwilioNumbers();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/bulk-calls/history`, { headers: getAuthHeaders() });
            if (response.data.success) {
                setHistoryLogs(response.data.logs);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    };

    useEffect(() => {
        fetchHistory();
        // Poll history every 10 seconds
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, []);

    // --- Softphone Setup ---
    useEffect(() => {
        const setupSoftphone = async () => {
            if (device) return; // Prevent multiple initializations

            try {
                // 🟢 CORRECTED ENDPOINT: Use /api/token as defined in server.js
                const { data } = await axios.get(`${API_BASE_URL}/token`, { headers: getAuthHeaders() });

                if (data.success && data.token) {
                    const newDevice = new Device(data.token, {
                        codecPreferences: ['opus', 'pcmu'],
                        fakeLocalDTMF: true,
                        enableRingingState: true,
                        logLevel: 1, // Enable logging for debugging
                    });

                    // 🟢 FIX: Use 'registered' event for newer SDK versions
                    newDevice.on('registered', () => {
                        console.log('✅ Twilio Device Registered and Ready');
                        setIsDeviceReady(true);
                        setSoftphoneStatus('Ready to Call');
                        setDevice(newDevice);
                    });

                    // Fallback for older SDK versions
                    newDevice.on('ready', () => {
                        console.log('✅ Twilio Device Ready (Legacy)');
                        setIsDeviceReady(true);
                        setSoftphoneStatus('Ready to Call');
                        if (!device) setDevice(newDevice);
                    });

                    newDevice.on('error', (error) => {
                        console.error('❌ Twilio Device Error:', error);
                        setSoftphoneStatus('Error: ' + error.message);
                        playFeedbackSound('error');
                    });

                    // 🟢 Handle incoming calls (if agent receives call)
                    newDevice.on('incoming', (call) => {
                        console.log('📞 Incoming call from:', call.parameters.From);
                        setSoftphoneStatus('Incoming Call...');
                        setActiveCallParams(call);

                        // Auto-accept for direct call mode
                        if (isDirectCallMode) {
                            call.accept();
                        }
                    });

                    // 🟢 Token expiry handling
                    newDevice.on('tokenWillExpire', async () => {
                        console.log('🔄 Token expiring, refreshing...');
                        try {
                            const refreshData = await axios.get(`${API_BASE_URL}/token`, { headers: getAuthHeaders() });
                            if (refreshData.data.success) {
                                newDevice.updateToken(refreshData.data.token);
                                console.log('✅ Token refreshed successfully');
                            }
                        } catch (err) {
                            console.error('❌ Failed to refresh token:', err);
                        }
                    });

                    await newDevice.register();
                    console.log('📡 Registering Twilio Device...');
                }
            } catch (err) {
                console.error("Failed to setup softphone:", err);
                setSoftphoneStatus('Failed to Init: ' + (err.response?.status === 404 ? 'Token Endpoint 404' : err.message));
            }
        };

        setupSoftphone();

        return () => {
            if (device) {
                try {
                    device.destroy();
                } catch (e) { console.error("Error destroying device", e) }
            }
        };
    }, []);

    const handleManualCall = async () => {
        if (!device || !manualNumber) {
            setError("Device not ready or number missing.");
            return;
        }
        try {
            setSoftphoneStatus('Dialing...');
            await device.connect({ params: { To: manualNumber } });
        } catch (err) {
            console.error("Call failed:", err);
            setSoftphoneStatus('Call Failed');
        }
    };

    const handleHangup = () => {
        if (device) {
            device.disconnectAll();
            setIsOnCall(false);
        }
    };

    // --- CSV Handling ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvFile(file);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Expect columns like 'Name', 'Phone' or 'Number'
                const contacts = results.data.map((row, index) => {
                    // Try to find phone number in common keys
                    const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('phone') || k.toLowerCase().includes('number') || k.toLowerCase().includes('mobile'));
                    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('first'));

                    let rawPhone = phoneKey ? row[phoneKey] : '';
                    let formattedPhone = rawPhone;

                    // Normalize Phone Number
                    if (rawPhone) {
                        // Remove all non-digit characters
                        const digitsOnly = rawPhone.replace(/\D/g, '');

                        // If it's exactly 10 digits, assume it's a local number and prepend selected country code
                        if (digitsOnly.length === 10) {
                            formattedPhone = `${countryCode}${digitsOnly}`;
                        } else if (rawPhone.startsWith('+')) {
                            // If it already has a plus, trust it (or do basic validation)
                            formattedPhone = rawPhone;
                        } else if (digitsOnly.length > 10) {
                            // If it's longer than 10, assume it might have country code but missing '+'
                            formattedPhone = `+${digitsOnly}`;
                        }
                    }

                    return {
                        id: index,
                        name: nameKey ? row[nameKey] : `Contact ${index + 1}`,
                        phone: formattedPhone,
                        originalPhone: rawPhone,
                        status: 'pending' // pending, calling, completed, failed
                    };
                }).filter(c => c.phone); // Filter out rows without phone

                if (contacts.length === 0) {
                    setError("No valid contacts found in CSV. Please ensure you have a 'Phone' or 'Number' column.");
                } else {
                    setCallQueue(contacts);
                    setError(null);
                    setCompletedCount(0);
                    setCurrentIndex(0);
                }
            },
            error: (err) => {
                setError("Failed to parse CSV file: " + err.message);
            }
        });
    };

    // Re-process queue if country code changes
    useEffect(() => {
        if (callQueue.length > 0 && !isCalling && completedCount === 0) {
            setCallQueue(prev => prev.map(c => {
                const digitsOnly = c.originalPhone.replace(/\D/g, '');
                if (digitsOnly.length === 10) {
                    return { ...c, phone: `${countryCode}${digitsOnly}` };
                }
                return c;
            }));
        }
    }, [countryCode]);


    // --- Call Logic ---
    const processNextCall = async () => {
        if (currentIndex >= callQueue.length) {
            setIsCalling(false);
            window.alert("All calls completed!");
            return;
        }

        const contact = callQueue[currentIndex];

        // Update status to calling
        setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'calling' } : c));
        setCurrentCallDuration(0);
        playFeedbackSound('dialing');

        // --- DIRECT CALL MODE (Real-time Browser → Twilio → Customer, No IVR) ---
        if (isDirectCallMode) {
            try {
                if (!device) throw new Error("Softphone initializing... Please wait.");
                if (!isDeviceReady) throw new Error("Softphone not ready. Check microphone permissions or refresh.");

                console.log(`📞 Starting Direct Call to: ${contact.phone}`);
                setSoftphoneStatus('Dialing...');

                // 🟢 DEBUG: Log call attempt details
                console.log('═══════════════════════════════════════════════════════════');
                console.log('📞 INITIATING DIRECT CALL');
                console.log('═══════════════════════════════════════════════════════════');
                console.log('📱 To Number:', contact.phone);
                console.log('📞 From Number (Caller ID):', selectedTwilioNumber);
                console.log('🔧 Device State:', device ? 'Initialized' : 'NULL');
                console.log('🔧 Device Ready:', isDeviceReady);
                console.log('═══════════════════════════════════════════════════════════');

                // Connect directly to customer number via browser softphone
                // This creates a real-time voice call: Agent Browser → Twilio → Customer
                const conn = await device.connect({
                    params: {
                        To: contact.phone,
                        callerId: selectedTwilioNumber, // 🟢 FIX: Pass as custom param, NOT 'From'
                        directCall: 'true', // Custom flag to indicate direct calling mode
                        campaignTitle: campaignTitle || 'Direct Call Campaign' // 🟢 Pass Campaign Title
                    }
                });

                console.log('✅ Connection Object Returned:', conn);
                console.log('📞 Connection Status:', conn.status ? conn.status() : 'unknown');

                // Store connection for reference
                setActiveCallParams(conn);
                setIsOnCall(true);

                // 🟢 Track call duration in real-time
                let durationInterval = setInterval(() => {
                    setCurrentCallDuration(prev => prev + 1);
                }, 1000);

                // 🟢 Handle Ringing State
                conn.on('ringing', () => {
                    console.log('🔔 Phone is ringing...');
                    setSoftphoneStatus('Ringing...');
                });

                // 🟢 Handle Call Accepted (Customer Answered)
                conn.on('accept', () => {
                    console.log('✅ Call accepted - Customer Answered!');
                    setSoftphoneStatus('On Call - Connected');
                    playFeedbackSound('success');
                });

                // 🟢 Handle Call Disconnect (Normal End)
                conn.on('disconnect', () => {
                    console.log('📴 Call disconnected');
                    clearInterval(durationInterval);
                    setIsOnCall(false);
                    setSoftphoneStatus('Ready to Call');
                    setActiveCallParams(null);

                    // Mark as completed
                    setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'completed' } : c));
                    setCompletedCount(prev => prev + 1);
                    playFeedbackSound('success');

                    // Delay Next Call - Move to next contact after delay
                    if (isCallingRef.current) {
                        console.log(`⏳ Waiting ${callDelay}s before next call...`);
                        timerRef.current = setTimeout(() => {
                            setCurrentIndex(prev => prev + 1);
                        }, callDelay * 1000);
                    }
                });

                // 🟢 Handle Call Rejected (Customer Declined)
                conn.on('reject', () => {
                    console.log('❌ Call rejected by customer');
                    clearInterval(durationInterval);
                    setIsOnCall(false);
                    setSoftphoneStatus('Call Rejected');
                    setActiveCallParams(null);

                    setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'failed', error: 'Call Rejected' } : c));
                    playFeedbackSound('error');

                    if (isCallingRef.current) {
                        timerRef.current = setTimeout(() => {
                            setCurrentIndex(prev => prev + 1);
                        }, callDelay * 1000);
                    }
                });

                // 🟢 Handle Call Cancel (Timeout / Not Answered)
                conn.on('cancel', () => {
                    console.log('⏰ Call cancelled/timeout');
                    clearInterval(durationInterval);
                    setIsOnCall(false);
                    setSoftphoneStatus('No Answer');
                    setActiveCallParams(null);

                    setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'failed', error: 'No Answer' } : c));
                    playFeedbackSound('error');

                    if (isCallingRef.current) {
                        timerRef.current = setTimeout(() => {
                            setCurrentIndex(prev => prev + 1);
                        }, callDelay * 1000);
                    }
                });

                // 🟢 Handle Connection Error
                conn.on('error', (err) => {
                    console.error("❌ Connection Error:", err);
                    clearInterval(durationInterval);
                    setIsOnCall(false);
                    setSoftphoneStatus('Call Error');
                    setActiveCallParams(null);

                    setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'failed', error: err.message || 'Connection Error' } : c));
                    playFeedbackSound('error');

                    if (isCallingRef.current) {
                        timerRef.current = setTimeout(() => {
                            setCurrentIndex(prev => prev + 1);
                        }, callDelay * 1000);
                    }
                });

            } catch (err) {
                console.error(`Direct Call failed for ${contact.phone}:`, err);
                setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'failed', error: err.message } : c));

                // Stop calling if device is fundamentally broken to prevent looping errors
                if (err.message.includes("Softphone")) {
                    setIsCalling(false);
                    setError(err.message);
                    return;
                }

                if (isCallingRef.current) {
                    timerRef.current = setTimeout(() => {
                        setCurrentIndex(prev => prev + 1);
                    }, callDelay * 1000);
                }
            }
            return;
        }

        // --- POWER DIALER MODE (Browser Call with IVR Options) ---
        if (isPowerDialer) {
            try {
                if (!device) throw new Error("Softphone initializing... Please wait.");
                if (!isDeviceReady) throw new Error("Softphone not ready. Check microphone permissions or refresh.");

                // Connect directly using the browser
                // 🟢 PASS CUSTOM PARAMS: We pass 'targetNumber' to be explicitly picked up by our /voice webhook
                const conn = await device.connect({
                    params: {
                        To: contact.phone, // Standard Twilio param (sometimes overridden)
                        targetNumber: contact.phone, // Custom param for safety
                        From: selectedTwilioNumber
                    }
                });

                // Store connection for transfer logic (also handled in global listener, but good to have ref)
                setActiveCallParams(conn);

                // Handle Call Events for Queue Progression
                conn.on('disconnect', () => {
                    // Mark as completed
                    setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'completed' } : c));
                    setCompletedCount(prev => prev + 1);
                    playFeedbackSound('success');

                    // Delay Next Call
                    if (isCallingRef.current) {
                        timerRef.current = setTimeout(() => {
                            setCurrentIndex(prev => prev + 1);
                        }, callDelay * 1000);
                    }
                });

                // If it fails to connect/rejects immediately
                conn.on('error', (err) => {
                    console.error("Connection Error:", err);
                    setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'failed', error: err.message || 'Connection Error' } : c));
                    if (isCallingRef.current) {
                        timerRef.current = setTimeout(() => {
                            setCurrentIndex(prev => prev + 1);
                        }, callDelay * 1000);
                    }
                });

            } catch (err) {
                console.error(`Power Dial failed for ${contact.phone}:`, err);
                setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'failed', error: err.message } : c));

                // Stop calling if device is fundamentally broken to prevent looping errors
                if (err.message.includes("Softphone")) {
                    setIsCalling(false);
                    setError(err.message);
                    return;
                }

                if (isCallingRef.current) {
                    timerRef.current = setTimeout(() => {
                        setCurrentIndex(prev => prev + 1);
                    }, callDelay * 1000);
                }
            }
            return;
        }

        // --- IVR BLAST MODE (Server Initiated) ---
        try {
            const response = await axios.post(`${API_BASE_URL}/bulk-calls/single`, {
                to: contact.phone,
                from: selectedTwilioNumber,
                introMessage: introMessage,
                ttsMessage: ttsMessage,
                forwardingNumber: forwardingNumber,
                agentNumber: agentNumber,
                holdMusicUrl: holdMusicUrl,
                campaignTitle: campaignTitle,
                recordCall: recordCall
            }, { headers: getAuthHeaders() });

            // Check if still calling after await
            if (!isCallingRef.current) return;

            const { callSid } = response.data;

            if (callSid) {
                // Poll for status until completed
                const pollInterval = setInterval(async () => {
                    // Check if paused during polling
                    if (!isCallingRef.current) {
                        clearInterval(pollInterval);
                        return;
                    }

                    try {
                        const statusRes = await axios.get(`${API_BASE_URL}/bulk-calls/status/${callSid}`, { headers: getAuthHeaders() });
                        const { status, duration } = statusRes.data;

                        // Update duration if available
                        if (duration) setCurrentCallDuration(duration);

                        // Check if call is finished
                        if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(status)) {
                            clearInterval(pollInterval);

                            // Mark as completed/failed in queue
                            setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: status === 'completed' ? 'completed' : 'failed' } : c));
                            setCompletedCount(prev => prev + 1);

                            if (status === 'completed') playFeedbackSound('success');
                            else playFeedbackSound('error');

                            // Wait for delay then proceed
                            if (isCallingRef.current) {
                                timerRef.current = setTimeout(() => {
                                    setCurrentIndex(prev => prev + 1);
                                }, callDelay * 1000);
                            }
                        } else {
                            // If still running in IVR mode
                            setCurrentCallDuration(prev => prev + 1);
                        }
                    } catch (err) {
                        console.error("Polling error:", err);
                    }
                }, 1000);

                timerRef.current = pollInterval;
            } else {
                throw new Error("No CallSid returned");
            }

        } catch (err) {
            console.error(`Call failed for ${contact.phone}:`, err);
            setCallQueue(prev => prev.map((c, i) => i === currentIndex ? { ...c, status: 'failed', error: err.message || 'Call Failed' } : c));

            // If immediate failure, wait delay and proceed
            if (isCallingRef.current) {
                timerRef.current = setTimeout(() => {
                    setCurrentIndex(prev => prev + 1);
                }, callDelay * 1000);
            }
        }
    };

    // --- Skip to Next Call Logic ---
    const handleSkipToNext = () => {
        // Disconnect current call if active
        if (device && isOnCall) {
            device.disconnectAll();
        }

        // Clear any pending timers
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            clearInterval(timerRef.current);
        }

        // Mark current contact as skipped (if exists)
        if (currentIndex < callQueue.length) {
            setCallQueue(prev => prev.map((c, i) =>
                i === currentIndex ? { ...c, status: 'failed', error: 'Skipped by user' } : c
            ));
        }

        // Move to next contact
        setCurrentIndex(prev => prev + 1);

        // Play feedback sound
        playFeedbackSound('success');
    };

    // --- Transfer / Forward Logic ---
    const handleRedirect = async (targetNumber) => {
        const sid = activeCallParams?.parameters?.CallSid || activeCallParams?.sid;
        if (!sid) {
            setError("No active call SID found to transfer.");
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/call/redirect`, {
                callSid: sid,
                transferTo: targetNumber
            }, { headers: getAuthHeaders() });
            playFeedbackSound('success');
            // We do not advance queue here; wait for disconnect.
        } catch (err) {
            console.error("Transfer failed:", err);
            playFeedbackSound('error');
            // 🟢 SHOW BACKEND ERROR: Display specific message like "Unverified Number"
            setError("Transfer failed: " + (err.response?.data?.message || err.message));
        }
    };

    // Effect to trigger call when index changes or isCalling becomes true
    useEffect(() => {
        if (isCalling && currentIndex < callQueue.length) {
            if (callQueue[currentIndex].status === 'pending') {
                processNextCall();
            }
        }
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                clearInterval(timerRef.current);
            }
        };
    }, [isCalling, currentIndex]);

    const handleStart = () => {
        // Basic Validation
        if (callQueue.length === 0) {
            setError("Please upload a CSV file with contacts first.");
            return;
        }

        if (!selectedTwilioNumber) {
            setError("Please select a Twilio number as Caller ID.");
            return;
        }

        // 🟢 Direct Call Mode Validation
        if (isDirectCallMode) {
            if (!device || !isDeviceReady) {
                setError("Softphone is not ready. Please wait for initialization or check microphone permissions.");
                return;
            }
        }

        // 🟢 Power Dialer Mode Validation
        if (isPowerDialer) {
            if (!device || !isDeviceReady) {
                setError("Softphone is not ready. Please wait for initialization or check microphone permissions.");
                return;
            }
        }

        // 🟢 IVR Mode Validation (needs TTS message)
        if (!isDirectCallMode && !isPowerDialer) {
            if (!ttsMessage) {
                setError("Please enter an AI Prompt/Message for IVR mode.");
                return;
            }
        }

        // Clear any previous errors
        setError(null);
        console.log(`🚀 Starting Bulk Calling - Mode: ${isDirectCallMode ? 'Direct Call' : isPowerDialer ? 'Power Dialer' : 'IVR Blast'}`);
        setIsCalling(true);
    };

    const handlePause = () => {
        console.log('⏸️ Pausing bulk calling...');
        setIsCalling(false);

        // Clear any pending timers
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            clearInterval(timerRef.current);
        }

        // 🟢 Disconnect active call if in Direct Call or Power Dialer mode
        if (device && isOnCall) {
            device.disconnectAll();
            setIsOnCall(false);
            setSoftphoneStatus('Paused');
        }
    };

    const handleReset = () => {
        console.log('🔄 Resetting bulk caller...');
        setIsCalling(false);

        // Clear any pending timers
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            clearInterval(timerRef.current);
        }

        // 🟢 Disconnect active call if any
        if (device && isOnCall) {
            device.disconnectAll();
            setIsOnCall(false);
        }

        // Reset all states
        setCurrentIndex(0);
        setCompletedCount(0);
        setCurrentCallDuration(0);
        setActiveCallParams(null);
        setSoftphoneStatus(isDeviceReady ? 'Ready to Call' : 'Initializing...');
        setCallQueue(prev => prev.map(c => ({ ...c, status: 'pending', error: undefined })));
        setError(null);
    };

    // --- Stats ---
    const stats = {
        totalContacts: callQueue.length,
        completed: completedCount,
        remaining: callQueue.length - completedCount,
    };

    const currentContact = currentIndex < callQueue.length ? callQueue[currentIndex] : null;

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 flex-grow overflow-y-auto" style={{ height: '100vh', paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, marginTop: `-${NAVBAR_HEIGHT_PX}px` }}>
            <header className="flex justify-between items-center mb-6 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                        {isDirectCallMode ? '📞 Real-Time Bulk Calling' : isPowerDialer ? '🎙️ Power Dialer Campaign' : '🔊 Bulk Voice Campaign (IVR)'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isDirectCallMode
                            ? 'One-by-one real-time calls. Talk directly to each contact from your browser.'
                            : isPowerDialer
                                ? 'Sequential calling with IVR menu options. AI, Agent, Forward options.'
                                : 'Automated IVR calls with Press 1/2 (AI) / Press 3 (Agent) / Press 4 (Forward)'}
                    </p>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title={<span className="text-blue-600 font-bold">TOTAL BULK CALLS</span>} value={historyLogs.length} icon={<MegaphoneIcon className="w-6 h-6 text-blue-600" />} color="bg-blue-100" borderColor="bg-blue-500" />
                <StatsCard title={<span className="text-purple-600 font-bold">TOTAL CONTACTS</span>} value={stats.totalContacts} icon={<UserIcon className="w-6 h-6 text-purple-600" />} color="bg-purple-100" borderColor="bg-purple-500" />
                <StatsCard title={<span className="text-green-600 font-bold">COMPLETED</span>} value={stats.completed} icon={<PhoneIcon className="w-6 h-6 text-green-600" />} color="bg-green-100" borderColor="bg-green-500" />
                <StatsCard title={<span className="text-orange-600 font-bold">REMAINING</span>} value={stats.remaining} icon={<ClockIcon className="w-6 h-6 text-orange-600" />} color="bg-orange-100" borderColor="bg-orange-500" />
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-md flex items-center font-medium">
                    <ExclamationTriangleIcon className='w-5 h-5 mr-3 flex-shrink-0' />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Configuration */}
                <div className="lg:col-span-1 space-y-6">



                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Configuration</h2>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Campaign Title</label>
                            <input type="text" value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="My Campaign" />
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Caller ID (Twilio Number)</label>
                            <select value={selectedTwilioNumber} onChange={(e) => setSelectedTwilioNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600" disabled={isCalling}>
                                <option value="">Select a number</option>
                                {availableTwilioNumbers.map((number, idx) => (
                                    <option key={`${number}-${idx}`} value={number}>{number}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Default Country Code</label>
                            <div className="relative">
                                <GlobeAltIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600"
                                    disabled={isCalling}
                                >
                                    {COUNTRY_CODES.map((c) => (
                                        <option key={c.code} value={c.code}>{c.country} ({c.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Upload CSV</label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <DocumentArrowUpIcon className="w-8 h-8 mb-3 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span></p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">CSV (Name, Phone)</p>
                                    </div>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={isCalling} />
                                </label>
                            </div>
                            {csvFile && <p className="text-sm text-green-600 mt-2">Loaded: {csvFile.name}</p>}
                        </div>

                        {/* IVR Configuration */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">IVR Settings</h3>

                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Intro / Menu Message</label>
                                <textarea value={introMessage} onChange={(e) => setIntroMessage(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Hello. Press 1 for English AI. Press 2 for Hindi AI. Press 3 for Agent. Press 4 to Forward. Press 5 for Direct Call." disabled={isCalling} />
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-indigo-500" />
                                    AI Prompt (Press 1 & 2) - <span className="text-xs text-gray-500">System Instruction for AI</span>
                                </label>
                                <textarea value={ttsMessage} onChange={(e) => setTtsMessage(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="You are a helpful assistant. Answer questions about our product..." disabled={isCalling} />
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <PhoneArrowUpRightIcon className="w-4 h-4 text-green-500" />
                                    Forward on Press 4 (Number)
                                </label>
                                <input type="text" value={forwardingNumber} onChange={(e) => setForwardingNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="+1234567890" disabled={isCalling} />
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <MusicalNoteIcon className="w-4 h-4 text-pink-500" />
                                    Hold Music URL (Optional)
                                </label>
                                <input type="text" value={holdMusicUrl} onChange={(e) => setHoldMusicUrl(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="https://example.com/music.mp3" disabled={isCalling} />
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-orange-500" />
                                    Real-time Agent (Press 3)
                                </label>
                                <input type="text" value={agentNumber} onChange={(e) => setAgentNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="+1987654321" disabled={isCalling} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Delay Between Calls (Seconds)</label>
                            <input type="number" value={callDelay} onChange={(e) => setCallDelay(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" min="1" disabled={isCalling} />
                        </div>

                        <div className="mb-4 flex items-center">
                            <input
                                type="checkbox"
                                id="recordCall"
                                checked={recordCall}
                                onChange={(e) => setRecordCall(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                disabled={isCalling}
                            />
                            <label htmlFor="recordCall" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Record Calls</label>
                        </div>

                        <div className="mb-4 flex items-center">
                            <input
                                type="checkbox"
                                id="enableSounds"
                                checked={enableSounds}
                                onChange={(e) => setEnableSounds(e.target.checked)}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="enableSounds" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 flex items-center gap-2">
                                <MusicalNoteIcon className="w-4 h-4" />
                                Dashboard Sound Effects
                            </label>
                        </div>

                        {/* Power Dialer Mode Toggle */}
                        <div className="mb-4 flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            <input
                                type="checkbox"
                                id="powerDialer"
                                checked={isPowerDialer}
                                onChange={(e) => {
                                    setIsPowerDialer(e.target.checked);
                                    if (e.target.checked) setIsDirectCallMode(false); // Disable Direct Call when Power Dialer is enabled
                                }}
                                className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                disabled={isCalling}
                            />
                            <div className="ml-3">
                                <label htmlFor="powerDialer" className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <MicrophoneIcon className="w-4 h-4 text-indigo-600" />
                                    Power Dialer Mode (Live Agent with IVR)
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Calls connect to YOU first with IVR menu. Logic: Browser → Customer → IVR Options.
                                </p>
                            </div>
                        </div>

                        {/* Direct Call Mode Toggle */}
                        <div className="mb-4 flex items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800">
                            <input
                                type="checkbox"
                                id="directCallMode"
                                checked={isDirectCallMode}
                                onChange={(e) => {
                                    setIsDirectCallMode(e.target.checked);
                                    if (e.target.checked) setIsPowerDialer(false); // Disable Power Dialer when Direct Call is enabled
                                }}
                                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                disabled={isCalling}
                            />
                            <div className="ml-3">
                                <label htmlFor="directCallMode" className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-green-600" />
                                    Direct Call Mode (Real-Time Voice)
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Real-time calling like Phone Dialer. Logic: YOU → Twilio → Customer (No IVR).
                                </p>
                            </div>
                        </div>

                        {/* 🟢 Softphone Status Indicator */}
                        <div className={`mb-4 p-3 rounded-lg border ${isDeviceReady ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isDeviceReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-bounce'}`}></div>
                                    <span className={`text-sm font-semibold ${isDeviceReady ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                        Softphone: {softphoneStatus}
                                    </span>
                                </div>
                                {isOnCall && (
                                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                        🔴 LIVE
                                    </span>
                                )}
                            </div>
                            {isDirectCallMode && !isDeviceReady && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                    ⚠️ Please allow microphone access for real-time calling.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Right Column: Execution & Display */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Current Caller Display */}
                    <div className={`bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border-2 transition-colors duration-300 ${isCalling ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'}`}>

                        {/* Progress Bar */}
                        {callQueue.length > 0 && (
                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round((completedCount / callQueue.length) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${(completedCount / callQueue.length) * 100}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {isCalling ? 'Calling in Progress...' : 'Ready to Start'}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {isCalling ? 'System is dialing contacts sequentially.' : 'Configure settings and upload CSV to begin.'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {!isCalling && currentIndex < callQueue.length && completedCount < callQueue.length && (
                                    <button onClick={handleStart} className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition flex items-center gap-2 font-bold shadow-lg transform hover:scale-105 active:scale-95">
                                        <PlayIcon className="w-6 h-6" /> Start
                                    </button>
                                )}
                                {isCalling && (
                                    <button onClick={handlePause} className="px-6 py-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition flex items-center gap-2 font-bold shadow-lg transform hover:scale-105 active:scale-95">
                                        <PauseIcon className="w-6 h-6" /> Pause
                                    </button>
                                )}
                                {/* Skip to Next Call Button - Shows when calling is active */}
                                {isCalling && currentIndex < callQueue.length - 1 && (
                                    <button
                                        onClick={handleSkipToNext}
                                        className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition flex items-center gap-2 font-bold shadow-lg transform hover:scale-105 active:scale-95"
                                        title="Skip current call and move to next"
                                    >
                                        <ArrowPathIcon className="w-6 h-6" /> Next Call
                                    </button>
                                )}
                                <button onClick={handleReset} className="px-4 py-3 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-full hover:bg-gray-300 transition flex items-center gap-2 font-semibold">
                                    <StopIcon className="w-5 h-5" /> Reset
                                </button>
                            </div>
                        </div>

                        {/* Active Call Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
                            {currentContact ? (
                                <>
                                    {/* Pulse Animation Background */}
                                    <div className={`absolute inset-0 opacity-20 ${currentContact.status === 'calling' ? 'bg-green-500 animate-pulse' : ''}`}></div>

                                    <div className="z-10 text-center w-full max-w-md">
                                        <div className="relative mx-auto mb-6">
                                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl border-4 ${currentContact.status === 'calling' ? 'bg-green-100 text-green-600 border-green-500' :
                                                currentContact.status === 'failed' ? 'bg-red-100 text-red-600 border-red-500' :
                                                    'bg-indigo-100 text-indigo-600 border-indigo-500'
                                                }`}>
                                                {currentContact.name.charAt(0).toUpperCase()}
                                            </div>
                                            {currentContact.status === 'calling' && (
                                                <span className="absolute -bottom-2 -right-2 flex h-8 w-8">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-8 w-8 bg-green-500 items-center justify-center">
                                                        <PhoneIcon className="h-4 w-4 text-white" />
                                                    </span>
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{currentContact.name}</h3>
                                        <p className="text-2xl text-gray-600 dark:text-gray-300 font-mono mb-2 tracking-widest">{currentContact.phone}</p>

                                        {currentContact.status === 'calling' && (
                                            <p className="text-lg text-green-600 font-mono mb-6 animate-pulse">
                                                Duration: {currentCallDuration}s
                                            </p>
                                        )}

                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <span className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm border ${currentContact.status === 'calling' ? 'bg-green-50 text-green-700 border-green-200' :
                                                currentContact.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    currentContact.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {currentContact.status}
                                            </span>

                                            {/* 🟢 ERROR DISPLAY TO HELP USER */}
                                            {currentContact.status === 'failed' && currentContact.error && (
                                                <div className="p-3 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm max-w-sm">
                                                    <p className="font-bold mb-1">Call Failed:</p>
                                                    {currentContact.error}
                                                </div>
                                            )}
                                        </div>

                                        {isCalling && currentContact.status === 'completed' && (
                                            <div className="mt-6 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 animate-bounce">
                                                <ClockIcon className="w-5 h-5" />
                                                <span className="font-medium">Next call in {callDelay}s...</span>
                                            </div>
                                        )}

                                        {/* Transfer Controls for Power Dialer and Direct Call Mode */}
                                        {(isPowerDialer || isDirectCallMode) && isOnCall && currentContact.status === 'calling' && (
                                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 w-full animate-fade-in-up">
                                                <p className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-wider">Call Controls</p>
                                                <div className="flex gap-2 justify-center flex-wrap">
                                                    {/* Hangup Button */}
                                                    <button
                                                        onClick={handleHangup}
                                                        className="flex flex-col items-center p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition border border-red-200"
                                                    >
                                                        <PhoneIcon className="w-6 h-6 mb-1 rotate-135" />
                                                        <span className="text-xs font-bold">Hangup</span>
                                                    </button>

                                                    {/* Transfer to Agent - Only show for Power Dialer with IVR */}
                                                    {isPowerDialer && agentNumber && (
                                                        <button
                                                            onClick={() => handleRedirect(agentNumber)}
                                                            className="flex flex-col items-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition border border-blue-200"
                                                        >
                                                            <UserIcon className="w-6 h-6 mb-1" />
                                                            <span className="text-xs font-bold">Transfer to Agent</span>
                                                        </button>
                                                    )}

                                                    {/* Forward - Only show for Power Dialer with IVR */}
                                                    {isPowerDialer && forwardingNumber && (
                                                        <button
                                                            onClick={() => handleRedirect(forwardingNumber)}
                                                            className="flex flex-col items-center p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition border border-green-200"
                                                        >
                                                            <PhoneArrowUpRightIcon className="w-6 h-6 mb-1" />
                                                            <span className="text-xs font-bold">Forward</span>
                                                        </button>
                                                    )}

                                                    {/* Blind Transfer - Show for both modes */}
                                                    <button
                                                        onClick={() => {
                                                            const num = prompt("Enter number to transfer to:");
                                                            if (num) handleRedirect(num);
                                                        }}
                                                        className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition border border-gray-200"
                                                    >
                                                        <ArrowPathIcon className="w-6 h-6 mb-1" />
                                                        <span className="text-xs font-bold">Blind Transfer</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <UserIcon className="w-10 h-10 opacity-50" />
                                    </div>
                                    <p className="text-lg font-medium">No active contact</p>
                                    <p className="text-sm opacity-75">Upload a CSV to populate the queue</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Queue List */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Call Queue</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {callQueue.map((contact, idx) => (
                                        <tr key={idx} className={idx === currentIndex ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{contact.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contact.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    contact.status === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                                                        contact.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {contact.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {callQueue.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                Upload a CSV file to see contacts here.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-6">
                        <div className="px-6 py-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Recent Call History</h3>
                            <button onClick={fetchHistory} className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
                                <ArrowPathIcon className="w-4 h-4" /> Refresh
                            </button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IVR Input</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {historyLogs.slice(0, 5).map((log, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{log.toNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'completed' || log.status === 'responded' ? 'bg-green-100 text-green-800' :
                                                    log.status === 'initiated' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {log.ivrOption ? `Pressed ${log.ivrOption}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {historyLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default BulkCallerPage;
