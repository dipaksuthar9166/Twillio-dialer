import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from 'socket.io-client'; // 🟢 ADD: Socket.IO client
import { PaperAirplaneIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, ChatBubbleLeftRightIcon, UserIcon, PhoneIcon, PaperClipIcon, FaceSmileIcon, MicrophoneIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = "http://localhost:3001/api";
// 💡 IMPORTANT: This should be your company's sending number (Twilio, etc.)
const MY_PHONE_NUMBER = "+14482317532"; 
const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar

// 🟢 ADD: Socket.IO connection
const socket = io('http://localhost:3001');


// Helper function to extract unique contacts from the logs
const extractUniqueContacts = (logs) => {
    const contactsMap = new Map();
    logs.forEach(log => {
        // Determine the contact number (the one that is NOT MY_PHONE_NUMBER)
        const contactNumber = log.to_number === MY_PHONE_NUMBER ? log.from_number : log.to_number;
        
        if (!contactNumber) return;

        // Store the log, ensuring the latest message is tracked
        if (!contactsMap.has(contactNumber) || new Date(log.sent_at) > new Date(contactsMap.get(contactNumber).latestTime)) {
             contactsMap.set(contactNumber, {
                number: contactNumber,
                latestMessage: log.message,
                latestTime: new Date(log.sent_at),
                status: log.status 
            });
        }
    });
    // Sort by latest time (newest first)
    return Array.from(contactsMap.values()).sort((a, b) => b.latestTime - a.latestTime);
};

const SMSPage = () => {
    const [selectedContact, setSelectedContact] = useState(null); 
    const [message, setMessage] = useState("");
    const [allSmsLogs, setAllSmsLogs] = useState([]); 
    const [uniqueContacts, setUniqueContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false); 
    const [searchInput, setSearchInput] = useState('');
    const fileInputRef = useRef(null); 
    const isFirstLoad = useRef(true); 
    
    // PAGINATION STATES: Show 10 contacts per page
    const [currentPage, setCurrentPage] = useState(1);
    const contactsPerPage = 10; 

    // Auth headers helper
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("userToken");
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    // --- Data Fetching ---
    const fetchSmsLogs = useCallback(async (isInitial = false) => {
        if (!isInitial) setLoading(true); 
        try {
            const res = await fetch(`${API_BASE_URL}/sms/logs`, { headers: { ...getAuthHeaders() } });
            if (!res.ok) {
                const errorBody = await res.json();
                throw new Error(errorBody.message || "Failed to fetch logs.");
            }
            const data = await res.json();
            
            if (data && data.success && Array.isArray(data.logs)) {
                setAllSmsLogs(data.logs);
                setUniqueContacts(extractUniqueContacts(data.logs));
            } else {
                setAllSmsLogs([]);
                setUniqueContacts([]);
            }
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // --- Current Conversation Filter (optimized) ---
    const currentConversation = useMemo(() => {
        if (!selectedContact) return [];
        return allSmsLogs
            .filter(log => log.to_number === selectedContact || log.from_number === selectedContact)
            .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at)); 
    }, [allSmsLogs, selectedContact]);

    // --- Initial Fetch & Socket Listeners ---
    useEffect(() => {
        fetchSmsLogs(true); 

        // 🟢 FIX: Replace polling with Socket.IO
        const handleIncomingMessage = (msg) => {
            console.log('Socket: Incoming message received', msg);
            // Add the new message to the logs
            const newLog = {
                sms_sid: msg.sid || msg.id || `temp_${Date.now()}`,
                from_number: msg.from,
                to_number: msg.to,
                message: msg.body || msg.message,
                sent_at: msg.sent_at || new Date().toISOString(),
                status: msg.status || 'received',
            };
            setAllSmsLogs(prev => [...prev, newLog]);
            setUniqueContacts(prev => extractUniqueContacts([...prev, newLog]));
        };

        socket.on('incoming_message', handleIncomingMessage);

        return () => socket.off('incoming_message', handleIncomingMessage);
    }, [fetchSmsLogs]); // fetchSmsLogs is stable due to useCallback

    // --- Auto Scroll to Bottom ---
    useEffect(() => {
        const logContainer = document.getElementById("sms-log-container");
        if (logContainer) {
            if (isFirstLoad.current || currentConversation.length > 0) {
                 logContainer.scrollTop = logContainer.scrollHeight;
                 isFirstLoad.current = false;
            }
        }
    }, [currentConversation]); 
    
    // Reset first load flag when changing contact
    useEffect(() => {
        isFirstLoad.current = true;
    }, [selectedContact]);

    // --- Send Message Handler ---
    const handleSendSms = async (e) => {
        e.preventDefault();
        if (!selectedContact || !message.trim()) {
            return setError("Please select a contact and enter a valid message.");
        }
        setLoading(true);
        setError(null);

        // 1. Prepare and add the message temporarily to the UI
        const tempMessage = message;
        const tempLog = {
            sms_sid: Date.now().toString(),
            to_number: selectedContact,
            from_number: MY_PHONE_NUMBER,
            message: tempMessage,
            sent_at: new Date().toISOString(),
            status: 'sending' 
        };
        setAllSmsLogs(prevLogs => [...prevLogs, tempLog]);
        setMessage(""); 

        try {
            const res = await fetch(`${API_BASE_URL}/sms/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() },
                body: JSON.stringify({ toNumber: selectedContact, message: tempMessage }),
            });

            if (!res.ok) {
                setAllSmsLogs(prevLogs => prevLogs.map(log => 
                    log.sms_sid === tempLog.sms_sid ? { ...log, status: 'failed', message: `${log.message} (Failed)` } : log
                ));
                const errData = await res.json();
                throw new Error(errData.message || `Failed to send SMS with status ${res.status}`);
            }
            
            await fetchSmsLogs(); 

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // --- UI Handlers ---
    
    const handleVoiceRecord = () => {
        if (!selectedContact) return setError("Select a contact before recording.");
        alert("Voice Recording Feature: You need to implement MediaRecorder API and backend upload logic.");
        setIsRecording(true);
        setError(null);
        setTimeout(() => setIsRecording(false), 2000);
    };

    const handleFileAttach = () => {
        if (!selectedContact) return setError("Select a contact before attaching a file.");
        if (fileInputRef.current) fileInputRef.current.click();
    };
    
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            alert(`File selected: ${file.name}. Now implement FormData and fetch to backend!`);
        }
        event.target.value = null; 
    };

    const onEmojiClick = () => {
        setMessage(prevMsg => prevMsg + ' 😀 '); 
    };

    // Format timestamp for contact list
    const formatTime = (date) => {
        if (!date) return "";
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
    }
    
    const selectedContactDisplay = selectedContact || "Select contact for discussion";
    
    // Filtered contacts based on search input
    const searchedContacts = uniqueContacts.filter(contact => 
        contact.number.includes(searchInput)
    );
    
    // New contact object for the manually entered number (if valid and not in list)
    const newContactObject = searchInput.length >= 10 && !uniqueContacts.some(c => c.number === searchInput)
        ? { number: searchInput, latestMessage: "New chat started", latestTime: new Date() }
        : null;

    // --- PAGINATION LOGIC ---
    const totalContacts = searchedContacts.length;
    const totalPages = Math.ceil(totalContacts / contactsPerPage);
    
    // Determine which contacts to display based on current page
    const startIndex = (currentPage - 1) * contactsPerPage;
    const endIndex = Math.min(startIndex + contactsPerPage, totalContacts);
    const paginatedContacts = searchedContacts.slice(startIndex, endIndex);

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };


    return (
        // 🟢 FIX: Applying height, overflow, and position compensation for fixed Navbar
        <div 
            className="flex h-screen bg-gray-50 overflow-hidden"
            style={{ 
                height: `calc(100vh - ${NAVBAR_HEIGHT_PX}px)`, // Total height minus Navbar height
                marginTop: NAVBAR_HEIGHT_PX, // Push content down below fixed Navbar
            }}
        > 
            
            {/* 1. Contact List Panel (Left) */}
            <div className="w-[300px] flex-none bg-white border-r border-gray-200 flex flex-col"> 
                
                {/* Search Header/New Contact Input */}
                <div className="p-3 border-b border-gray-200 flex flex-col flex-none">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-lg font-bold">
                            <UserIcon className="w-5 h-5"/>
                        </div>
                        <h3 className="font-semibold text-gray-800 flex-1">Messaging Dashboard</h3>
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500 cursor-pointer hover:text-blue-600" />
                        <EllipsisVerticalIcon className="w-5 h-5 text-gray-500 cursor-pointer hover:text-blue-600" />
                    </div>
                    {/* Search/New Number Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search or enter new number (+91...)"
                            value={searchInput}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9+]/g, '');
                                setSearchInput(val);
                                setCurrentPage(1); // Reset page on search

                                // Auto-select new contact logic
                                if (val.length >= 10 && !uniqueContacts.some(c => c.number === val)) {
                                    setSelectedContact(val);
                                } else if (uniqueContacts.some(c => c.number === val)) {
                                     setSelectedContact(val);
                                } else if (val.length === 0) {
                                     setSelectedContact(null);
                                }
                            }}
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 rounded-lg border border-gray-200 focus:bg-white focus:border-blue-500"
                        />
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-2 top-2.5" />
                    </div>
                </div>
                
                {/* Contact List (Scrollable Area) */}
                <div className="overflow-y-auto flex-1"> 
                    {loading && uniqueContacts.length === 0 ? (
                        <p className="p-4 text-center text-sm text-gray-500">Loading contacts...</p>
                    ) : (
                        <>
                            {/* Display the new number as a selectable option if it's not in the logs */}
                            {newContactObject && (
                                <div
                                    key={newContactObject.number}
                                    className={`flex items-center p-3 cursor-pointer border-b hover:bg-gray-100 transition 
                                        ${selectedContact === newContactObject.number ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                                    onClick={() => {
                                        setSelectedContact(newContactObject.number);
                                        setSearchInput(''); 
                                        setError(null);
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-700 font-bold text-lg mr-3">
                                        <ChatBubbleLeftRightIcon className="w-5 h-5"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate text-gray-800">{newContactObject.number} (New)</p>
                                        <p className="text-xs text-gray-500 truncate">Tap to start conversation</p>
                                    </div>
                                </div>
                            )}

                            {/* Existing Contacts List (PAGINATED) */}
                            {paginatedContacts.map((contact) => (
                                <div
                                    key={contact.number}
                                    className={`flex items-center p-3 cursor-pointer border-b hover:bg-gray-100 transition 
                                        ${selectedContact === contact.number && !newContactObject ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                                    onClick={() => {
                                        setSelectedContact(contact.number);
                                        setSearchInput(''); 
                                        setError(null);
                                    }}
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-700 font-bold text-lg mr-3">
                                        {contact.number.slice(-2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate text-gray-800">{contact.number}</p>
                                        <p className="text-xs text-gray-500 truncate">{contact.latestMessage}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 flex-none ml-2">
                                        {formatTime(contact.latestTime)}
                                    </span>
                                </div>
                            ))}
                            
                            {totalContacts === 0 && !loading && !newContactObject && (
                                <p className="p-4 text-center text-sm text-gray-500">No conversations yet.</p>
                            )}
                        </>
                    )}
                </div>

                {/* PAGINATION CONTROLS (Footer) */}
                <div className="p-3 border-t border-gray-200 flex flex-col gap-2 flex-none">
                    
                    {/* 1. Summary Text */}
                    {totalContacts > 0 && (
                        <p className="text-xs text-gray-600 text-center">
                            Showing **{startIndex + 1}** to **{endIndex}** of **{totalContacts}** total filtered records.
                        </p>
                    )}

                    {/* 2. Navigation Buttons */}
                    <div className="flex justify-between items-center text-sm">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || loading || totalPages <= 1}
                            className="p-1 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <span className="text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || loading || totalPages <= 1}
                            className="p-1 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Conversation Panel (Right) */}
            <div className="flex-1 bg-gray-100 flex flex-col"> 
                
                {/* Chat Header */}
                <div className="bg-white p-3 border-b shadow-sm flex items-center justify-between min-h-[66px] flex-none">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-700 font-bold text-lg mr-3">
                            {selectedContact ? selectedContact.slice(-2) : ''}
                        </div>
                        <h3 className="text-base font-semibold text-gray-800">
                            {selectedContactDisplay}
                        </h3>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500">
                        <PhoneIcon className="w-5 h-5 cursor-pointer hover:text-blue-600" />
                        <EllipsisVerticalIcon className="w-5 h-5 cursor-pointer hover:text-blue-600" />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-1 mt-2 text-xs mx-4 rounded flex-none">
                        Error: {error}
                    </div>
                )}
                
                {/* Chat Log Container (Scrollable) */}
                <div id="sms-log-container" className="flex-1 overflow-y-auto p-6 space-y-4"> 
                    {!selectedContact ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <ChatBubbleLeftRightIcon className="w-8 h-8 mb-2" />
                            <p className="text-sm">Select a chat to begin messaging.</p>
                        </div>
                    ) : currentConversation.length === 0 && !newContactObject ? (
                        <p className="text-center text-sm text-gray-500 pt-10">Start a conversation with {selectedContact}.</p>
                    ) : (
                        currentConversation.map((sms, index) => {
                            const isSent = sms.from_number === MY_PHONE_NUMBER; 
                            
                            const isSending = sms.status === 'sending';
                            const isFailed = sms.status === 'failed' || sms.status === 'undelivered';
                            
                            const bubbleClasses = isSent 
                                ? "ml-auto bg-blue-500 text-white rounded-lg shadow-sm rounded-tr-none" 
                                : "mr-auto bg-white text-gray-800 rounded-lg shadow-sm rounded-tl-none border border-gray-200";

                            return (
                                <div key={sms.sms_sid || index} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-2 text-sm ${bubbleClasses} ${isSending ? 'opacity-70' : ''}`}> 
                                        <p className="whitespace-pre-wrap">{sms.message}</p>
                                        <p className={`text-[10px] mt-1 ${isSent ? 'text-blue-900/70' : 'text-gray-500'} text-right`}>
                                            {isFailed && <span className="text-red-300 mr-1">Failed</span>}
                                            {isSending ? 'Sending...' : (sms.sent_at ? new Date(sms.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Send Message Form (Footer) */}
                <form
                    onSubmit={handleSendSms}
                    className="bg-white p-3 flex items-end gap-3 border-t border-gray-200 flex-none relative"
                >
                    {/* EMOJI PICKER Button */}
                    <button type="button" 
                        onClick={onEmojiClick} 
                        disabled={loading || !selectedContact}
                        className="p-2 text-gray-500 hover:text-yellow-600 disabled:text-gray-300"
                        title="Emoji">
                        <FaceSmileIcon className="w-6 h-6" />
                    </button>
                    
                    {/* ATTACHMENT/FILE UPLOAD Button & Hidden Input */}
                    <button type="button" 
                        onClick={handleFileAttach}
                        disabled={loading || !selectedContact}
                        className="p-2 text-gray-500 hover:text-blue-600 disabled:text-gray-300"
                        title="Attach File">
                        <PaperClipIcon className="w-6 h-6 rotate-45" />
                    </button>
                    
                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={!selectedContact}
                    />

                    {/* Message Input */}
                    <textarea
                        placeholder={selectedContact ? `Type a message to ${selectedContact}...` : "Select a contact first..."}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="border border-gray-300 p-2 text-sm rounded-lg flex-1 resize-none min-h-[44px] max-h-[100px] focus:ring-blue-600 focus:border-blue-600"
                        rows="1"
                        disabled={loading || !selectedContact || isRecording}
                    />

                    {/* Send or Voice Record Button (Conditional) */}
                    <button
                        type={message.trim() ? "submit" : "button"}
                        onClick={!message.trim() ? handleVoiceRecord : undefined} 
                        disabled={loading || !selectedContact}
                        className={`text-white p-2 rounded-full h-10 w-10 flex items-center justify-center transition disabled:bg-gray-400 ${
                            message.trim() || loading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={message.trim() ? "Send Message" : "Voice Record"}
                    >
                        {loading ? (
                            <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                        ) : message.trim() ? (
                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                        ) : (
                            <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'animate-pulse text-red-100' : ''}`} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SMSPage;