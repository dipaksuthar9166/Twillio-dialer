import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatsCard from '../components/StatsCard';
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    PhoneIcon,
    ClockIcon,
    FunnelIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;

const BulkCallHistoryPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("userToken");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${API_BASE_URL}/bulk-calls/history`, { headers });
            if (response.data.success) {
                setLogs(response.data.logs);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;

        try {
            const token = localStorage.getItem("userToken");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.delete(`${API_BASE_URL}/bulk-calls/history/${id}`, { headers });
            setLogs(prev => prev.filter(log => log._id !== id));
        } catch (err) {
            console.error("Failed to delete log:", err);
            alert("Failed to delete log.");
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedLogs.length === 0) return;
        setIsDeleteModalOpen(true);
    };

    const confirmBulkDelete = async () => {
        setIsDeleteModalOpen(false);
        try {
            const token = localStorage.getItem("userToken");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Delete sequentially or in parallel? Parallel is faster but might hit rate limits if many.
            // For now, let's do parallel.
            await Promise.all(selectedLogs.map(id => axios.delete(`${API_BASE_URL}/bulk-calls/history/${id}`, { headers })));

            setLogs(prev => prev.filter(log => !selectedLogs.includes(log._id)));
            setSelectedLogs([]);
        } catch (err) {
            console.error("Failed to delete logs:", err);
            alert("Failed to delete some logs.");
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Filter Logic
    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.toNumber.includes(searchTerm) ||
            (log.campaignTitle && log.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'All Status' || log.status === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Calculate Stats
    const stats = {
        total: logs.length,
        accepted: logs.filter(l => ['completed', 'answered', 'responded'].includes(l.status)).length,
        missed: logs.filter(l => ['failed', 'busy', 'no-answer', 'canceled'].includes(l.status)).length,
        avgDuration: logs.reduce((acc, curr) => acc + (curr.duration || 0), 0) / (logs.length || 1) // Placeholder if duration exists
    };

    // Helper to format duration
    const formatDuration = (seconds) => {
        if (seconds === undefined || seconds === null || isNaN(seconds)) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 flex-grow overflow-y-auto" style={{ height: '100vh', paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, marginTop: `-${NAVBAR_HEIGHT_PX}px` }}>
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Bulk Call Log Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitor and analyze all call activities with detailed insights.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="TOTAL CALLS"
                        value={stats.total}
                        subtitle="All time"
                        icon={<PhoneIcon className="w-6 h-6 text-purple-600" />}
                        color="bg-purple-100 dark:bg-purple-900/30"
                        borderColor="bg-purple-500"
                    />
                    <StatsCard
                        title="ACCEPTED"
                        value={stats.accepted}
                        subtitle="Answered"
                        icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
                        color="bg-green-100 dark:bg-green-900/30"
                        borderColor="bg-green-500"
                    />
                    <StatsCard
                        title="MISSED CALLS"
                        value={stats.missed}
                        subtitle="Missed / Failed"
                        icon={<XCircleIcon className="w-6 h-6 text-yellow-600" />}
                        color="bg-yellow-100 dark:bg-yellow-900/30"
                        borderColor="bg-yellow-500"
                    />
                    <StatsCard
                        title="AVG DURATION"
                        value={formatDuration(Math.round(stats.avgDuration))}
                        subtitle="Duration"
                        icon={<ClockIcon className="w-6 h-6 text-pink-600" />}
                        color="bg-pink-100 dark:bg-pink-900/30"
                        borderColor="bg-pink-500"
                    />
                </div>

                {/* Filter Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Search */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Search Calls</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option>All Status</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="initiated">Initiated</option>
                                <option value="no-answer">No Answer</option>
                            </select>
                        </div>

                        {/* Call Type (Placeholder) */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Call Type</label>
                            <select className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option>All Types</option>
                                <option>Outbound</option>
                                <option>Inbound</option>
                            </select>
                        </div>

                        {/* Per Page */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Per Page</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="block w-full pl-3 pr-8 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-3 flex items-end gap-2">
                            <button
                                onClick={fetchHistory}
                                className="h-[42px] px-4 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
                                title="Refresh"
                            >
                                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                                onClick={handleBulkDeleteClick}
                                disabled={selectedLogs.length === 0}
                                className={`h-[42px] px-4 flex items-center justify-center gap-2 rounded-lg transition-all shadow-sm ${selectedLogs.length > 0
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                    }`}
                                title="Delete Selected"
                            >
                                <TrashIcon className="w-5 h-5" />
                                <span className="font-medium">Delete Selected</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Call History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50/50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-2 py-5 text-left w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedLogs(displayLogs.map(l => l._id));
                                                } else {
                                                    setSelectedLogs([]);
                                                }
                                            }}
                                            checked={displayLogs.length > 0 && selectedLogs.length === displayLogs.length}
                                        />
                                    </th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">From</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">To</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">IVR Input</th>
                                    <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Forwarded To</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {displayLogs.length > 0 ? (
                                    displayLogs.map((log, idx) => {
                                        const dateObj = new Date(log.createdAt);
                                        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                <td className="px-2 py-5 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className={`rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-opacity duration-200 ${selectedLogs.includes(log._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                        checked={selectedLogs.includes(log._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedLogs(prev => [...prev, log._id]);
                                                            } else {
                                                                setSelectedLogs(prev => prev.filter(id => id !== log._id));
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    #{startIndex + idx + 1}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{dateStr}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{timeStr}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {log.campaignTitle || <span className="text-gray-400 italic">Manual Call</span>}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    {log.fromNumber}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 dark:text-white font-mono font-medium">
                                                    {log.toNumber}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${log.status === 'completed' || log.status === 'responded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                                                        log.status === 'initiated' || log.status === 'ringing' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                                                            log.status === 'failed' || log.status === 'busy' || log.status === 'no-answer' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                                                'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'completed' || log.status === 'responded' ? 'bg-emerald-500' :
                                                            log.status === 'initiated' || log.status === 'ringing' ? 'bg-blue-500' :
                                                                log.status === 'failed' || log.status === 'busy' || log.status === 'no-answer' ? 'bg-red-500' :
                                                                    'bg-gray-500'
                                                            }`}></span>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                    {formatDuration(Number(log.duration))}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    {log.ivrOption ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                            Key {log.ivrOption}
                                                        </span>
                                                    ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                    {log.forwardingNumber ? (
                                                        <div className="flex items-center gap-2">
                                                            <ArrowPathIcon className="w-3 h-3 text-gray-400" />
                                                            {log.forwardingNumber}
                                                        </div>
                                                    ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                    <PhoneIcon className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-lg font-medium text-gray-900 dark:text-white">No call history found</p>
                                                <p className="text-sm mt-1 max-w-xs mx-auto">Your call logs will appear here once you start making calls.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredLogs.length)}</span> of <span className="font-medium">{filteredLogs.length}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100 animate-bounce-in border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <TrashIcon className="w-8 h-8 text-red-500 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete {selectedLogs.length} Logs?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                Are you sure you want to delete these records? <br />
                                <span className="text-red-500 font-medium">This action cannot be undone.</span>
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmBulkDelete}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/30 active:scale-95"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkCallHistoryPage;
