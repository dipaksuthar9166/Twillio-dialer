import React, { useState, useEffect } from 'react';
import { PhoneIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;

// --- DUMMY/MOCKED DATA ---
const DUMMY_LOGS = [
    ...Array(30).fill(null).map((_, i) => ({
        id: `CA${i + 1}`,
        from: `+91987xxxx${(i + 1).toString().padStart(3, '0')}`,
        to: '+1448xxxx532',
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'no-answer' : 'initiated',
        duration: (i * 10 + 20).toString(),
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        type: i % 2 === 0 ? 'Outbound' : 'Inbound'
    }))
];

const fetchWithRetry = async (url, options = {}, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status} - ${errorBody.message || 'Server error'}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed for ${url}:`, error.message);
            if (i === retries - 1) throw error;
        }
    }
};

const getStatusBadge = (status) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider whitespace-nowrap';
    switch (status) {
        case 'completed': return `${base} bg-green-100 text-green-800`;
        case 'no-answer':
        case 'failed':
        case 'busy':
        case 'canceled': return `${base} bg-red-100 text-red-800`;
        case 'initiated':
        case 'ringing': return `${base} bg-yellow-100 text-yellow-800`;
        default: return `${base} bg-gray-100 text-gray-700`;
    }
};

const CallLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [stats, setStats] = useState({ totalCalls: 0, completed: 0, missed: 0, avgDuration: "00:00" });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [callTypeFilter, setCallTypeFilter] = useState('All Types');

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState('10');

    const formatDurationDisplay = (durationSeconds) => {
        if (typeof durationSeconds === 'string') {
            durationSeconds = parseInt(durationSeconds) || 0;
        }
        if (!durationSeconds) return "00:00";
        const totalSeconds = durationSeconds;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const fetchAllCallLogs = async () => {
        setIsLoading(true);
        setError(null);
        setCurrentPage(1);

        let errorOccurred = false;

        try {
            let rawData;
            try {
                rawData = await fetchWithRetry(`${API_BASE_URL}/call-logs`);
            } catch (err) {
                errorOccurred = true;
                rawData = { logs: DUMMY_LOGS };
            }

            const logsToProcess = Array.isArray(rawData) ? rawData : (rawData.logs || DUMMY_LOGS);

            const processedLogs = logsToProcess.map(log => {
                const timestamp = log.timestamp || log.startTime || log.start_time || new Date().toISOString();
                const dateObj = new Date(timestamp);
                const durationSeconds = log.duration ? parseInt(log.duration, 10) : 0;

                return {
                    id: log.id || log.call_sid || Math.random().toString(36).substring(2, 9),
                    callerNumber: log.from || log.from_number,
                    phoneNumber: log.to || log.to_number,
                    type: log.type || (log.from === '+1448xxxx532' ? 'Outbound' : 'Inbound'),
                    status: log.status || 'initiated',
                    duration: durationSeconds,
                    durationDisplay: durationSeconds > 0 ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s` : '—',
                    dateTime: dateObj.toLocaleDateString('en-IN') + ' ' + dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    recording: durationSeconds > 0 ? 'View' : '—',
                };
            });

            const total = processedLogs.length;
            const completed = processedLogs.filter(l => l.status === 'completed').length;
            const missed = processedLogs.filter(l => ['no-answer', 'failed', 'busy', 'canceled'].includes(l.status)).length;

            const totalDurationSeconds = processedLogs.filter(l => l.status === 'completed').reduce((sum, log) => sum + log.duration, 0);
            const avgDuration = completed > 0 ? formatDurationDisplay(Math.round(totalDurationSeconds / completed)) : "00:00";

            setLogs(processedLogs);
            setStats({ totalCalls: total, completed, missed, avgDuration });
            setFilteredLogs(processedLogs);

            if (errorOccurred) {
                setError("Connection failed, showing mock data.");
            }

        } catch (err) {
            setError(err.message || 'Unknown network error occurred.');
            setLogs(DUMMY_LOGS);
            setStats({ totalCalls: DUMMY_LOGS.length, completed: 0, missed: 0, avgDuration: "00:00" });
            setFilteredLogs(DUMMY_LOGS);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let results = logs;

        if (statusFilter !== 'All Status') {
            results = results.filter(log => log.status === statusFilter.toLowerCase().replace(' ', '-'));
        }

        if (callTypeFilter !== 'All Types') {
            results = results.filter(log => log.type === callTypeFilter);
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            results = results.filter(log =>
                (log.callerNumber || '').toLowerCase().includes(lower) ||
                (log.phoneNumber || '').toLowerCase().includes(lower)
            );
        }

        setCurrentPage(1);
        setFilteredLogs(results);
    }, [searchTerm, statusFilter, callTypeFilter, logs]);

    useEffect(() => {
        fetchAllCallLogs();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [perPage]);

    const logsPerPage = parseInt(perPage);
    const totalFilteredRecords = filteredLogs.length;
    const totalPages = Math.ceil(totalFilteredRecords / logsPerPage);
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

    const statusOptions = ['All Status', 'completed', 'no-answer', 'ringing', 'initiated', 'busy', 'failed'];
    const typeOptions = ['All Types', 'Inbound', 'Outbound'];
    const perPageOptions = ['10', '25', '50'];

    return (
        <div
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Call Log Management</h1>
            <p className="text-gray-500 mb-6 border-b pb-4 text-sm">Monitor and analyze all call activities with detailed insights.</p>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center" role="alert">
                    <ExclamationCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10">
                <StatsCard
                    title="TOTAL CALLS"
                    value={stats.totalCalls}
                    subtitle="All incoming and outgoing calls"
                    change="This month"
                    icon={<PhoneIcon className="w-5 h-5 text-pink-500" />}
                    color="bg-pink-50"
                    borderColor="bg-pink-500"
                    changeColor="text-pink-500"
                    timeRangeLabel="Total"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="COMPLETED"
                    value={stats.completed}
                    subtitle="Successfully answered calls"
                    change="Answered"
                    icon={<CheckCircleIcon className="w-5 h-5 text-green-500" />}
                    color="bg-green-50"
                    borderColor="bg-green-500"
                    changeColor="text-green-500"
                    timeRangeLabel="Success"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="MISSED CALLS"
                    value={stats.missed}
                    subtitle="Unanswered calls"
                    change="No Answer"
                    icon={<XCircleIcon className="w-5 h-5 text-red-500" />}
                    color="bg-red-50"
                    borderColor="bg-red-500"
                    changeColor="text-red-500"
                    timeRangeLabel="Missed"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="AVG DURATION"
                    value={stats.avgDuration}
                    subtitle="Average answered call time"
                    change="Duration"
                    icon={<ClockIcon className="w-5 h-5 text-purple-500" />}
                    color="bg-purple-50"
                    borderColor="bg-purple-500"
                    changeColor="text-purple-500"
                    timeRangeLabel="Minutes"
                    isLoading={isLoading}
                />
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Search Calls</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by caller, phone, or agent..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                disabled={isLoading}
                            />
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="col-span-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={isLoading}
                        >
                            {statusOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Call Type</label>
                        <select
                            value={callTypeFilter}
                            onChange={(e) => setCallTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={isLoading}
                        >
                            {typeOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-1 flex flex-col justify-end">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Per Page</label>
                        <div className='flex gap-2'>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 text-sm"
                                disabled={isLoading}
                            >
                                {perPageOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <button
                                onClick={fetchAllCallLogs}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center justify-center disabled:bg-gray-400"
                                disabled={isLoading}
                                title="Refresh Logs"
                            >
                                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call History Table */}
            <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200 relative z-10">
                <h2 className="text-xl font-bold text-gray-800 p-6 border-b">Call History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['#', 'Caller Number', 'Phone Number', 'Type', 'Duration', 'Date & Time', 'Status', 'Recording', 'Actions'].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan="9" className="text-center py-10 text-gray-500">Loading call history...</td></tr>
                            ) : currentLogs.length === 0 ? (
                                <tr><td colSpan="9" className="text-center py-10 text-gray-500">No calls found for current filters.</td></tr>
                            ) : (
                                currentLogs.map((log, index) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-100">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{indexOfFirstLog + index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.callerNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.phoneNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.durationDisplay}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{log.dateTime}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={getStatusBadge(log.status)}>{log.status.toUpperCase().replace('-', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer">{log.recording || '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button className="text-indigo-600 hover:text-indigo-900">View</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t bg-gray-50 text-sm text-gray-600 font-medium flex justify-between items-center relative z-10">
                    <span>Showing <strong>{indexOfFirstLog + 1}</strong> to <strong>{Math.min(indexOfLastLog, totalFilteredRecords)}</strong> of <span className='font-bold'>{totalFilteredRecords}</span> total filtered records.</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 transition"
                        >
                            Prev
                        </button>
                        <span className="px-2 py-1 text-gray-800 font-bold">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition z-20">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default CallLogPage;