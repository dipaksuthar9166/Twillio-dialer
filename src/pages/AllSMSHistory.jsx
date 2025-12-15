import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ChatBubbleLeftRightIcon,
    UserIcon,
    UserGroupIcon,
    ClockIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    PaperAirplaneIcon,
    MegaphoneIcon,
    BoltIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;

const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const AllSMSHistory = () => {
    const [smsLogs, setSmsLogs] = useState([]);
    const [stats, setStats] = useState({
        totalMessages: 0,
        bulkMessages: 0,
        singleMessages: 0,
        autoMessages: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, bulk, single, auto
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, sent, delivered, failed, pending
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchAllSMSHistory();
    }, []);

    const fetchAllSMSHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch from all available sources
            const promises = [
                axios.get(`${API_BASE_URL}/sms/logs`, { headers: getAuthHeaders() }).catch(() => ({ data: { logs: [] } })),
                axios.get(`${API_BASE_URL}/bulk/history`, { headers: getAuthHeaders() }).catch(() => ({ data: { logs: [] } }))
            ];

            const [smsLogsRes, bulkLogsRes] = await Promise.all(promises);

            // Process SMS logs - these are single messages sent via the Single SMS page
            const singleLogs = (smsLogsRes.data?.logs || [])
                .filter(log => log.direction === 'outbound')
                .map(log => ({
                    ...log,
                    type: 'single',
                    id: log._id || log.sms_sid,
                    timestamp: log.sent_at || log.createdAt,
                    from: log.from_number,
                    to: log.to_number,
                    message: log.message,
                    status: log.status
                }));

            // Process bulk logs
            const bulkLogs = (bulkLogsRes.data?.logs || []).map(log => ({
                ...log,
                type: 'bulk',
                id: log._id || log.sms_sid,
                timestamp: log.sent_at || log.createdAt,
                from: log.from_number || log.fromNumber,
                to: log.to_number || log.toNumber,
                message: log.message,
                status: log.status
            }));

            // Auto messages - for now, we'll leave this empty until the endpoint is created
            const autoLogs = [];

            // Combine and sort by timestamp
            const allLogs = [...singleLogs, ...bulkLogs, ...autoLogs].sort((a, b) =>
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            setSmsLogs(allLogs);
            setStats({
                totalMessages: allLogs.length,
                bulkMessages: bulkLogs.length,
                singleMessages: singleLogs.length,
                autoMessages: autoLogs.length
            });
        } catch (err) {
            console.error('Failed to fetch SMS history:', err);
            setError('Failed to load SMS history. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getFilteredLogs = () => {
        let filtered = smsLogs;

        // Filter by type (all, bulk, single, auto)
        if (filter !== 'all') {
            filtered = filtered.filter(log => log.type === filter);
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(log =>
                log.status && log.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        // Filter by search query (search in phone numbers and message content)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(log =>
                (log.from && log.from.toLowerCase().includes(query)) ||
                (log.to && log.to.toLowerCase().includes(query)) ||
                (log.message && log.message.toLowerCase().includes(query))
            );
        }

        return filtered;
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'bulk':
                return <MegaphoneIcon className="w-5 h-5 text-purple-600" title="Bulk Message" />;
            case 'single':
                return <UserIcon className="w-5 h-5 text-blue-600" title="Single Message" />;
            case 'auto':
                return <BoltIcon className="w-5 h-5 text-yellow-600" title="Auto Message" />;
            default:
                return <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = (status || 'unknown').toLowerCase();

        if (['sent', 'delivered', 'received'].includes(statusLower)) {
            return (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    {status}
                </span>
            );
        } else if (statusLower === 'failed') {
            return (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                    <XCircleIcon className="w-3 h-3" />
                    Failed
                </span>
            );
        } else if (statusLower === 'pending') {
            return (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Pending
                </span>
            );
        }

        return (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {status}
            </span>
        );
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredLogs = getFilteredLogs();
    const totalPages = Math.ceil(filteredLogs.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, statusFilter, searchQuery, perPage]);

    return (
        <div
            className="p-8 bg-gray-50 dark:bg-gray-900 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            {/* Header */}
            <header className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-600" />
                        All SMS History
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Complete history of all SMS messages sent from your account
                    </p>
                </div>
                <button
                    onClick={fetchAllSMSHistory}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center gap-2 font-semibold shadow-md"
                    disabled={isLoading}
                >
                    <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title={<span className="text-indigo-600 font-bold">TOTAL MESSAGES</span>}
                    value={stats.totalMessages}
                    subtitle="All messages"
                    change="Total"
                    icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-100"
                    borderColor="bg-indigo-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title={<span className="text-purple-600 font-bold">BULK MESSAGES</span>}
                    value={stats.bulkMessages}
                    subtitle="Campaign messages"
                    change="Bulk"
                    icon={<MegaphoneIcon className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-100"
                    borderColor="bg-purple-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title={<span className="text-blue-600 font-bold">SINGLE MESSAGES</span>}
                    value={stats.singleMessages}
                    subtitle="Individual messages"
                    change="Single"
                    icon={<UserIcon className="w-6 h-6 text-blue-600" />}
                    color="bg-blue-100"
                    borderColor="bg-blue-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title={<span className="text-yellow-600 font-bold">AUTO MESSAGES</span>}
                    value={stats.autoMessages}
                    subtitle="Automated messages"
                    change="Auto"
                    icon={<BoltIcon className="w-6 h-6 text-yellow-600" />}
                    color="bg-yellow-100"
                    borderColor="bg-yellow-500"
                    isLoading={isLoading}
                />
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-md flex items-center font-medium" role="alert">
                    <ExclamationTriangleIcon className='w-5 h-5 mr-3 flex-shrink-0' />
                    {error}
                </div>
            )}

            {/* Advanced Filters Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search Box */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Messages
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search phone numbers or content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                            <svg
                                className="absolute left-3 top-3 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="sent">Sent</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* Message Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Message Type
                        </label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                        >
                            <option value="all">All Types</option>
                            <option value="single">Single</option>
                            <option value="bulk">Bulk</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>

                    {/* Per Page */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Per Page
                        </label>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(searchQuery || statusFilter !== 'all' || filter !== 'all') && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Filters:</span>
                        {searchQuery && (
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium flex items-center gap-1">
                                Search: "{searchQuery}"
                                <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900 dark:hover:text-indigo-200">×</button>
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                                Status: {statusFilter}
                                <button onClick={() => setStatusFilter('all')} className="hover:text-green-900 dark:hover:text-green-200">×</button>
                            </span>
                        )}
                        {filter !== 'all' && (
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium flex items-center gap-1">
                                Type: {filter}
                                <button onClick={() => setFilter('all')} className="hover:text-purple-900 dark:hover:text-purple-200">×</button>
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setFilter('all');
                            }}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 flex gap-2 flex-wrap">
                {[
                    { key: 'all', label: 'All Messages', icon: ChatBubbleLeftRightIcon, color: 'indigo' },
                    { key: 'bulk', label: 'Bulk', icon: MegaphoneIcon, color: 'purple' },
                    { key: 'single', label: 'Single', icon: UserIcon, color: 'blue' },
                    { key: 'auto', label: 'Auto', icon: BoltIcon, color: 'yellow' }
                ].map(({ key, label, icon: Icon, color }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-lg font-semibold transition duration-150 flex items-center gap-2 ${filter === key
                            ? `bg-${color}-600 text-white shadow-md`
                            : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-${color}-50 dark:hover:bg-${color}-900/20`
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Messages Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading messages...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-lg font-medium">No messages found</p>
                            <p className="text-sm">Try changing the filter or send some messages</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        From
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        To
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Message
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Sent At
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(log.type)}
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                                                    {log.type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                                            {log.from || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                                            {log.to || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-md">
                                            <div className="truncate" title={log.message}>
                                                {log.message || 'No message content'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(log.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatTimestamp(log.timestamp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 px-6 py-4">
                {/* Page Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.min(endIndex, filteredLogs.length)}</span> of{' '}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredLogs.length}</span> filtered messages
                    {filteredLogs.length !== smsLogs.length && (
                        <span className="text-gray-500"> ({smsLogs.length} total)</span>
                    )}
                </div>

                {/* Pagination Buttons */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentPage === 1
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                                }`}
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${currentPage === pageNum
                                                ? 'bg-indigo-600 text-white shadow-md scale-110'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                    <span className="px-2 text-gray-500">...</span>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="w-10 h-10 rounded-lg font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 transition-all duration-200"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentPage === totalPages
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                                }`}
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllSMSHistory;
