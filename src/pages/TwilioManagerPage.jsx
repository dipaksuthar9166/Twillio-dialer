import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CheckCircleIcon,
    ExclamationCircleIcon,
    CpuChipIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const TwilioManagerPage = () => {
    // Configuration state (account credentials)
    const [config, setConfig] = useState({
        accountSid: '',
        authToken: '',
        phoneNumber: '',
        whatsappNumber: ''
    });

    // UI state helpers
    const [status, setStatus] = useState({ configured: false, loading: true });
    const [message, setMessage] = useState(null);
    const [apiKeys, setApiKeys] = useState([]);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const navigate = useNavigate();

    const API_BASE_URL = 'http://localhost:3001/api';

    // Fetch stored Twilio config on mount
    useEffect(() => {
        fetchConfig();
    }, []);

    // ---------------------------------------------------------------------
    // Backend helpers
    // ---------------------------------------------------------------------
    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${API_BASE_URL}/twilio-config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.configured) {
                setStatus({ configured: true, loading: false });
                setConfig(prev => ({
                    ...prev,
                    accountSid: res.data.accountSid,
                    authToken: '', // keep token hidden
                    phoneNumber: res.data.phoneNumber,
                    whatsappNumber: res.data.whatsappNumber || ''
                }));
                // Load API keys automatically
                fetchApiKeys();
            } else {
                setStatus({ configured: false, loading: false });
            }
        } catch (err) {
            console.error('Error fetching config', err);
            setStatus({ configured: false, loading: false });
        }
    };

    const fetchApiKeys = async () => {
        setApiLoading(true);
        setApiError(null);
        try {
            const userToken = localStorage.getItem('userToken');
            const res = await axios.get(`${API_BASE_URL}/twilio/keys`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            setApiKeys(res.data.keys || []);
        } catch (err) {
            console.error('Error fetching API keys', err);
            setApiError('Failed to load API keys.');
        } finally {
            setApiLoading(false);
        }
    };

    // ---------------------------------------------------------------------
    // Form handlers
    // ---------------------------------------------------------------------
    const handleChange = e => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSave = async e => {
        e.preventDefault();
        setMessage({ type: 'info', text: 'Verifying and auto-configuring resources...' });
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.post(`${API_BASE_URL}/twilio-config`, config, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.data) {
                setMessage({
                    type: 'success',
                    text: `Setup Complete! Auto-created API Key & TwiML App.`
                });
            } else {
                setMessage({ type: 'success', text: 'Connected successfully!' });
            }

            setStatus({ configured: true, loading: false });
            setConfig(prev => ({ ...prev, authToken: '' }));
            fetchApiKeys();
            window.dispatchEvent(new Event('twilioConfigUpdated'));
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Connection failed' });
        }
    };

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    return (
        <div className="h-full overflow-y-auto overflow-x-hidden bg-[#f0f2f5] dark:bg-[#111b21] scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-[#2a3942] scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-[#374955]">
            <div className="max-w-6xl mx-auto p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#e9edef] mb-8">Twilio Management Dashboard</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#202c33] rounded-xl shadow-sm border border-gray-200 dark:border-[#2a3942] p-6">
                            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-[#e9edef] flex items-center gap-2">
                                <CpuChipIcon className="w-6 h-6" />
                                Credentials
                            </h2>
                            {status.configured ? (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-[#0b141a] rounded-lg border border-green-100 dark:border-[#111b21] flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-green-800 dark:text-[#00a884]">System Connected</p>
                                        <p className="text-xs text-green-600 dark:text-[#8696a0] mt-1">Using Account: {config.accountSid}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 bg-yellow-50 dark:bg-[#0b141a] rounded-lg border border-yellow-100 dark:border-[#111b21] flex items-start gap-3">
                                    <ExclamationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-yellow-800 dark:text-[#ffd279]">Not Configured</p>
                                        <p className="text-xs text-yellow-600 dark:text-[#8696a0] mt-1">Please enter your Twilio API credentials to enable services.</p>
                                    </div>
                                </div>
                            )}
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-[#8696a0] mb-1">Account SID</label>
                                    <input
                                        type="text"
                                        name="accountSid"
                                        value={config.accountSid}
                                        onChange={handleChange}
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-[#2a3942] bg-gray-50 dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef] focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required={!status.configured}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-[#8696a0] mb-1">Auth Token</label>
                                    <input
                                        type="password"
                                        name="authToken"
                                        value={config.authToken}
                                        onChange={handleChange}
                                        placeholder={status.configured ? "Enter new to update" : "xxxxxxxx..."}
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-[#2a3942] bg-gray-50 dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef] focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required={!status.configured}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-[#8696a0] mb-1">Twilio Phone Number (Optional)</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={config.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-[#2a3942] bg-gray-50 dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef] focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-[#8696a0] mb-1">WhatsApp Number (Optional)</label>
                                    <input
                                        type="text"
                                        name="whatsappNumber"
                                        value={config.whatsappNumber}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-[#2a3942] bg-gray-50 dark:bg-[#111b21] text-gray-900 dark:text-[#e9edef] focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                {message && (
                                    <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {message.text}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
                                >
                                    {status.configured ? 'Update Configuration' : 'Connect & Save'}
                                </button>
                            </form>
                        </div>
                    </div>
                    {/* API Keys Section */}
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-[#e9edef]">Available Twilio API Keys</h2>
                        {apiLoading ? (
                            <p className="text-gray-600 dark:text-[#8696a0]">Loading API keys…</p>
                        ) : apiError ? (
                            <p className="text-red-600 dark:text-[#ff6b6b]">{apiError}</p>
                        ) : apiKeys.length === 0 ? (
                            <p className="text-gray-600 dark:text-[#8696a0]">No API keys loaded. Enter Account SID and Auth Token, then save.</p>
                        ) : (
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {apiKeys.map((item, idx) => (
                                    <li key={idx} className="bg-white dark:bg-[#202c33] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-[#2a3942]">
                                        <p className="font-medium text-gray-900 dark:text-[#e9edef]">{item.friendlyName || 'Unnamed Key'}</p>
                                        <p className="text-sm text-gray-600 dark:text-[#8696a0] break-all">SID: {item.sid}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default TwilioManagerPage;
