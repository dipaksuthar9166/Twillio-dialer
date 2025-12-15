import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EnvelopeIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = 'http://localhost:3001/api';

const SMSLogsTable = ({ isBulkLogs = false }) => { // 🟢 FIX: Accept isBulkLogs prop
    const [smsLogs, setSmsLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = localStorage.getItem("userId"); // Get current user's ID

    const fetchSmsLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 🟢 FIX: Determine endpoint based on isBulkLogs prop
            const endpoint = isBulkLogs ? `${API_BASE_URL}/bulk/history` : `${API_BASE_URL}/sms/logs`;

            const response = await axios.get(endpoint, {
                params: {
                    userId: userId
                }
            });

            // Check the response structure for { success: true, logs: [...] }
            if (response.data.success && Array.isArray(response.data.logs)) {
                setSmsLogs(response.data.logs);
            } else {
                setSmsLogs([]);
                setError("Invalid data structure received from server.");
            }
        } catch (err) {
            console.error("Failed to fetch SMS logs:", err);
            setError("Failed to connect to SMS log API. Ensure the backend is running on port 3001.");
            setSmsLogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSmsLogs();
    }, []);

    // UI helper for status badge styling
    const getStatusBadge = (status) => {
        const base = 'px-3 py-1 text-xs font-semibold rounded-full uppercase';
        switch (status) {
            case 'delivered': return `${base} bg-green-100 text-green-800`;
            case 'sent': return `${base} bg-blue-100 text-blue-800`;
            case 'failed': return `${base} bg-red-100 text-red-800`;
            case 'received': return `${base} bg-purple-100 text-purple-800`;
            default: return `${base} bg-gray-100 text-gray-700`;
        }
    };


    return (
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200 mt-8 fade-in slide-up">
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800 flex items-center slide-right">
                    <EnvelopeIcon className="w-6 h-6 mr-2 text-indigo-600" /> Recent SMS Logs
                </h2>
                <button
                    onClick={fetchSmsLogs}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 flex items-center gap-1 hover-lift"
                    disabled={isLoading}
                >
                    <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 text-sm flex items-center">
                        <ExclamationTriangleIcon className='w-5 h-5 mr-2' /> **Error:** {error}
                    </div>
                )}

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sent At</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && smsLogs.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-10 text-gray-500">Loading SMS history...</td></tr>
                        ) : smsLogs.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-10 text-gray-500">No recent SMS logs found.</td></tr>
                        ) : (
                            smsLogs.map((sms) => (
                                <tr key={sms.sms_sid} className="hover:bg-gray-50 fade-slide-right hover-lift" style={{ animationDelay: `${0.1 * smsLogs.indexOf(sms)}s` }}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sms.from_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{sms.to_number}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{sms.message}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={getStatusBadge(sms.status)}>{sms.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(sms.sent_at).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SMSLogsTable;
