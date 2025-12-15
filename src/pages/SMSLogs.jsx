import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { ClockIcon, XMarkIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar


// --- Helper for Status Badge Styling ---
const StatusBadge = ({ status }) => {
    const baseStyle = "px-3 py-1 text-xs font-semibold rounded-full capitalize";
    switch (status?.toLowerCase()) {
        case 'delivered':
        case 'sent':
            return <span className={`${baseStyle} bg-green-100 text-green-700`}>{status}</span>;
        case 'failed':
        case 'undelivered':
            return <span className={`${baseStyle} bg-red-100 text-red-700`}>{status}</span>;
        case 'pending':
        case 'queued':
            return <span className={`${baseStyle} bg-yellow-100 text-yellow-700`}>{status}</span>;
        default:
            return <span className={`${baseStyle} bg-gray-100 text-gray-700`}>{status}</span>;
    }
};

// Renamed to the correct component name for parent component usage
const SMSLogsTable = ({ isBulkLogs }) => {
    const [smsLogs, setSmsLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // PAGINATION STATES
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    // Fetch Logic
    const fetchSmsLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setCurrentPage(1);
        try {
            const response = await axios.get(`${API_BASE_URL}/sms/logs`);

            if (response.data.success) {
                const sortedLogs = Array.isArray(response.data.logs)
                    ? response.data.logs.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
                    : [];
                setSmsLogs(sortedLogs);
            } else {
                setError(response.data.message || "An unknown error occurred on the server.");
            }
        } catch (err) {
            console.error("Failed to fetch SMS logs:", err);
            setError("Failed to connect to the backend API. Check if the server is running.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSmsLogs();
    }, [fetchSmsLogs]);

    // Filtering Effect: Filters logs based on the 'isBulkLogs' prop
    useEffect(() => {
        let logsToFilter = smsLogs;

        if (isBulkLogs) {
            // Assumption: Filter for bulk campaign simulation
            logsToFilter = smsLogs.filter(log =>
                (log.message && log.message.includes('{Name}')) ||
                (log.source && log.source.toLowerCase() === 'bulk')
            );

            // Simulation fallback if no specific bulk logs are found
            if (logsToFilter.length === 0 && smsLogs.length > 0) {
                logsToFilter = smsLogs.slice(0, 3).map(log => ({ ...log, message: `[BULK SIMULATION] ${log.message}` }));
            }
        }

        setFilteredLogs(logsToFilter);
        setCurrentPage(1); // Reset page on filter change
    }, [smsLogs, isBulkLogs]);


    // --- PAGINATION LOGIC ---
    const totalLogs = filteredLogs.length;
    const totalPages = Math.ceil(totalLogs / logsPerPage);

    // Calculate start and end index for the current page
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = Math.min(startIndex + logsPerPage, totalLogs);

    // Logs to display on the current page
    const currentLogs = filteredLogs.slice(startIndex, endIndex);

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };


    // Helper function to format the date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        // 🟢 FIX: Applying height, overflow, and position compensation for fixed Navbar
        // NOTE: Since this component is typically nested, its parent should handle the outer p-8,
        // but we are wrapping the content here for standalone scrollability, matching previous page fixes.
        <div
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200">
                <header className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ClockIcon className="w-6 h-6 text-indigo-600" /> Recent SMS Logs
                    </h2>
                    <button
                        onClick={fetchSmsLogs}
                        className="flex items-center text-sm px-3 py-1 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                        disabled={isLoading}
                    >
                        <ArrowPathIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </header>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 flex items-start">
                        <XMarkIcon className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['#', 'From', 'To', 'Message Snippet', 'Status', 'Sent At'].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500 flex items-center justify-center">
                                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Loading SMS logs...
                                    </td>
                                </tr>
                            ) : totalLogs === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500">
                                        No SMS logs found {isBulkLogs ? 'for bulk campaigns.' : 'for all messages.'}
                                    </td>
                                </tr>
                            ) : (
                                // Map over the PAGINATED logs (currentLogs)
                                currentLogs.map((sms, index) => (
                                    <tr key={sms.sms_sid || index} className="hover:bg-gray-50 transition duration-100">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {sms.from_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {sms.to_number}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-sm truncate">
                                            {sms.message.substring(0, 50)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <StatusBadge status={sms.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(sms.sent_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination Controls --- */}
                {/* Only show controls if there are logs and we are not loading */}
                {totalLogs > logsPerPage && !isLoading && (
                    <div className="p-4 border-t border-gray-200 flex flex-col gap-2">

                        {/* Summary Text (e.g., Showing 1 to 10 of 42 total records) */}
                        <p className="text-xs text-gray-600 text-center">
                            Showing **{startIndex + 1}** to **{endIndex}** of **{totalLogs}** total records.
                        </p>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center text-sm">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-1 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SMSLogsTable;