import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PaperAirplaneIcon,
    DevicePhoneMobileIcon,
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ClockIcon,
    UserIcon,
    PhoneIcon,
    DocumentTextIcon,
    SparklesIcon
} from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;

const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const SingleMessage = () => {
    const [recipientNumber, setRecipientNumber] = useState('');
    const [senderNumber, setSenderNumber] = useState('');
    const [message, setMessage] = useState('');
    const [availableNumbers, setAvailableNumbers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [recentMessages, setRecentMessages] = useState([]);

    // Fetch available sender numbers
    useEffect(() => {
        const fetchNumbers = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/from-numbers`, { headers: getAuthHeaders() });
                const numbers = response.data?.numbers || response.data || [];
                setAvailableNumbers(numbers);
                if (numbers.length > 0) {
                    setSenderNumber(numbers[0]);
                }
            } catch (error) {
                console.error('Error fetching numbers:', error);
                setNotification({ type: 'error', message: 'Failed to load sender numbers.' });
            }
        };
        fetchNumbers();
        fetchRecentMessages();
    }, []);

    const fetchRecentMessages = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/sms/logs`, { headers: getAuthHeaders() });
            const logs = response.data?.logs || [];
            setRecentMessages(logs.slice(0, 5)); // Get last 5 messages
        } catch (error) {
            console.error('Error fetching recent messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!recipientNumber || !message) {
            setNotification({ type: 'error', message: 'Please fill in all required fields.' });
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/sms/send`, {
                toNumber: recipientNumber,
                fromNumber: senderNumber,
                message: message
            }, { headers: getAuthHeaders() });

            setNotification({ type: 'success', message: '✅ Message sent successfully!' });
            setMessage('');
            setRecipientNumber('');
            fetchRecentMessages(); // Refresh recent messages
        } catch (error) {
            console.error('Error sending message:', error);
            setNotification({
                type: 'error',
                message: error.response?.data?.message || '❌ Failed to send message. Please try again.'
            });
        } finally {
            setLoading(false);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    // Calculate SMS segments
    const smsCount = message.length === 0 ? 0 : Math.ceil(message.length / 160);
    const charactersUsed = message.length;
    const charactersRemaining = (smsCount * 160) - charactersUsed;

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div
            className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-md">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                            Send Single SMS
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                            Compose and send individual text messages instantly to any mobile number
                        </p>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title={<span className="text-indigo-600 font-bold">AVAILABLE SENDERS</span>}
                    value={availableNumbers.length}
                    subtitle="Twilio numbers"
                    change="Active"
                    icon={<PhoneIcon className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-100"
                    borderColor="bg-indigo-500"
                />
                <StatsCard
                    title={<span className="text-green-600 font-bold">CHARACTERS</span>}
                    value={charactersUsed}
                    subtitle={`${charactersRemaining} remaining`}
                    change="Count"
                    icon={<DocumentTextIcon className="w-6 h-6 text-green-600" />}
                    color="bg-green-100"
                    borderColor="bg-green-500"
                />
                <StatsCard
                    title={<span className="text-purple-600 font-bold">SMS SEGMENTS</span>}
                    value={smsCount}
                    subtitle="Message parts"
                    change="Segments"
                    icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-100"
                    borderColor="bg-purple-500"
                />
                <StatsCard
                    title={<span className="text-orange-600 font-bold">RECENT SENT</span>}
                    value={recentMessages.length}
                    subtitle="Last messages"
                    change="History"
                    icon={<ClockIcon className="w-6 h-6 text-orange-600" />}
                    color="bg-orange-100"
                    borderColor="bg-orange-500"
                />
            </div>

            {/* Notification */}
            {notification && (
                <div className={`mb-6 p-4 rounded-xl shadow-lg border-l-4 flex items-center gap-3 animate-slide-in ${notification.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                    }`}>
                    {notification.type === 'success' ? (
                        <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                    ) : (
                        <XCircleIcon className="w-6 h-6 flex-shrink-0" />
                    )}
                    <span className="font-medium">{notification.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Compose Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Panel Header */}
                        <div className="px-8 py-6 bg-indigo-600 dark:bg-indigo-700 border-b border-indigo-700">
                            <div className="flex items-center gap-3">
                                <SparklesIcon className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-bold text-white">Compose New Message</h2>
                            </div>
                            <p className="text-indigo-100 text-sm mt-1">Fill in the details below to send your SMS</p>
                        </div>

                        {/* Form Content */}
                        <div className="p-8 space-y-6">
                            {/* Recipient Number */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    <UserIcon className="w-4 h-4 text-indigo-600" />
                                    Recipient Number
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={recipientNumber}
                                        onChange={(e) => setRecipientNumber(e.target.value)}
                                        placeholder="Enter phone number (e.g., +1234567890)"
                                        className="block w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:border-indigo-400"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Include country code (e.g., +91 for India, +1 for USA)
                                </p>
                            </div>

                            {/* Sender Number */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    <PhoneIcon className="w-4 h-4 text-indigo-600" />
                                    Sender Number
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={senderNumber}
                                    onChange={(e) => setSenderNumber(e.target.value)}
                                    className="block w-full px-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white shadow-sm hover:border-indigo-400 transition-all duration-200"
                                    disabled={availableNumbers.length === 0}
                                >
                                    {availableNumbers.length > 0 ? (
                                        availableNumbers.map((num) => (
                                            <option key={num} value={num}>{num}</option>
                                        ))
                                    ) : (
                                        <option>No numbers available</option>
                                    )}
                                </select>
                                {availableNumbers.length === 0 && (
                                    <p className="mt-2 text-xs text-red-500">
                                        ⚠️ No Twilio numbers configured. Please add numbers in settings.
                                    </p>
                                )}
                            </div>

                            {/* Message Content */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-indigo-600" />
                                    Message Content
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={6}
                                    placeholder="Type your message here... Keep it concise and clear."
                                    className="block w-full px-4 py-4 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none dark:bg-gray-700 dark:text-white shadow-sm hover:border-indigo-400 transition-all duration-200"
                                    maxLength={1000}
                                />
                                <div className="flex justify-between items-center mt-3 px-2">
                                    <div className="flex gap-4 text-xs">
                                        <span className={`font-medium ${charactersUsed > 160 ? 'text-orange-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {charactersUsed} / 1000 characters
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className={`font-medium ${smsCount > 1 ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {smsCount} SMS segment{smsCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {smsCount > 1 && (
                                        <span className="text-xs text-orange-600 font-medium">
                                            ⚠️ Multi-part message
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Send Button */}
                            <div className="pt-4">
                                <button
                                    onClick={handleSendMessage}
                                    disabled={loading || availableNumbers.length === 0 || !recipientNumber || !message}
                                    className={`w-full flex items-center justify-center gap-3 px-8 py-4 text-base font-bold rounded-xl shadow-lg transition-all duration-200 ${loading || availableNumbers.length === 0 || !recipientNumber || !message
                                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            Sending Message...
                                        </>
                                    ) : (
                                        <>
                                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                                            Send Message Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Messages Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-8">
                        {/* Sidebar Header */}
                        <div className="px-6 py-5 bg-purple-600 dark:bg-purple-700 border-b border-purple-700">
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-white" />
                                <h3 className="text-lg font-bold text-white">Recent Messages</h3>
                            </div>
                            <p className="text-purple-100 text-xs mt-1">Last 5 sent messages</p>
                        </div>

                        {/* Recent Messages List */}
                        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                            {recentMessages.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm font-medium">No recent messages</p>
                                    <p className="text-xs mt-1">Your sent messages will appear here</p>
                                </div>
                            ) : (
                                recentMessages.map((msg, index) => (
                                    <div
                                        key={msg._id || index}
                                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${msg.status === 'sent' || msg.status === 'delivered'
                                                    ? 'bg-green-500'
                                                    : msg.status === 'failed'
                                                        ? 'bg-red-500'
                                                        : 'bg-yellow-500'
                                                    }`}></div>
                                                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                                    {msg.to_number || 'Unknown'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTimestamp(msg.sent_at || msg.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                            {msg.message || 'No content'}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${msg.status === 'sent' || msg.status === 'delivered'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : msg.status === 'failed'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {msg.status || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleMessage;
