import React, { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import { io } from 'socket.io-client';
import {
  PhoneIcon, MagnifyingGlassIcon, ArrowPathIcon, ExclamationCircleIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/solid';
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import confetti from 'canvas-confetti';

const API_BASE_URL = 'http://localhost:3001/api';
const MAX_RETRIES = 3;
const DUMMY_USER_TOKEN = '1';
const NAVBAR_HEIGHT_PX = 66;

// --- DUMMY DATA (30 logs) ---
const DUMMY_LOGS = [
  ...Array(30).fill(null).map((_, i) => {
    const status = i % 5 === 0 ? 'completed' : i % 5 === 1 ? 'no-answer' : i % 5 === 2 ? 'initiated' : i % 5 === 3 ? 'busy' : 'failed';
    const duration = status === 'completed' ? (i * 10 + 30) : 0;
    return {
      id: `CA${i + 1}`,
      from: `+91987${String(i + 1).padStart(7, '0')}`,
      to: '+14482317532',
      status,
      duration: duration.toString(),
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      type: i % 2 === 0 ? 'Outbound' : 'Inbound',
      recording_url: status === 'completed' ? `https://example.com/recording/${i + 1}` : null
    };
  })
];

// Socket.IO connection
const socket = io('http://localhost:3001');

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorBody.message || 'Server error'}`);
      }
      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};

const CallHistory = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [stats, setStats] = useState({ totalCalls: 0, accepted: 0, missed: 0, avgDuration: "00:00" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [callTypeFilter, setCallTypeFilter] = useState('All Types');
  const [redialLoadingId, setRedialLoadingId] = useState(null);
  const [redialMessage, setRedialMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState('10');

  const formatDurationDisplay = (seconds) => {
    if (!seconds || seconds <= 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const fetchAllCallLogs = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      let rawData;
      try {
        rawData = await fetchWithRetry(`${API_BASE_URL}/call-logs`, {
          headers: { 'Authorization': `Bearer ${DUMMY_USER_TOKEN}` }
        });
      } catch (err) {
        console.warn("API failed, using dummy data:", err.message);
        rawData = { logs: DUMMY_LOGS };
        setError("API unreachable. Showing mock data.");
      }

      const logsToProcess = Array.isArray(rawData) ? rawData : (rawData.logs || rawData || DUMMY_LOGS);

      const processedLogs = logsToProcess.map(log => {
        const duration = parseInt(log.duration || 0, 10);
        const hasRecording = !!log.recording_url;

        return {
          id: log.id || log.call_sid || Math.random().toString(36).substr(2, 9),
          callerNumber: log.from_number || 'Unknown',
          phoneNumber: log.to_number || 'Unknown',
          type: log.direction || 'Unknown',
          status: log.status?.toLowerCase() || 'unknown',
          duration,
          durationDisplay: formatDurationDisplay(duration),
          dateTime: new Date(log.timestamp || log.start_time).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          recording: hasRecording ? 'View' : '—',
          recordingUrl: log.recording_url
        };
      });

      // Stats
      const total = processedLogs.length;
      const accepted = processedLogs.filter(l => l.status === 'completed').length;
      const missed = processedLogs.filter(l => ['no-answer', 'failed', 'busy', 'canceled'].includes(l.status)).length;
      const totalDuration = processedLogs.filter(l => l.status === 'accepted').reduce((s, l) => s + l.duration, 0);
      const avgDuration = accepted > 0 ? formatDurationDisplay(Math.round(totalDuration / accepted)) : "00:00";

      setLogs(processedLogs);
      setStats({ totalCalls: total, accepted, missed, avgDuration });
      setFilteredLogs(processedLogs);

    } catch (err) {
      setError("Failed to load call logs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedial = async (log) => {
    setRedialLoadingId(log.id);
    setRedialMessage(null);

    try {
      const res = await fetchWithRetry(`${API_BASE_URL}/dial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DUMMY_USER_TOKEN}` },
        body: JSON.stringify({
          fromNumber: '+14482317532',
          dialNumber: log.phoneNumber
        })
      }, 1);

      setRedialMessage({ type: 'success', text: `Dialing ${log.phoneNumber}...` });
    } catch (err) {
      setRedialMessage({ type: 'error', text: 'Dial failed.' });
    } finally {
      setRedialLoadingId(null);
      setTimeout(fetchAllCallLogs, 3000);
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      await fetchWithRetry(`${API_BASE_URL}/call-logs/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${DUMMY_USER_TOKEN}` }
      });
      setLogs(prev => prev.filter(log => log.id !== itemToDelete));
      setFilteredLogs(prev => prev.filter(log => log.id !== itemToDelete));
      setRedialMessage({ type: 'success', text: 'Call log deleted successfully.' });

      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f87171', '#fca5a5'] // Red shades to match delete action
      });

      // Clear success message after 3 seconds
      setTimeout(() => setRedialMessage(null), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setRedialMessage({ type: 'error', text: 'Failed to delete call log.' });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    let results = logs;

    if (statusFilter !== 'All Status') {
      const filter = statusFilter.toLowerCase().replace(' ', '-');
      results = results.filter(l => l.status === filter);
    }
    if (callTypeFilter !== 'All Types') {
      results = results.filter(l => l.type === callTypeFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(l =>
        l.callerNumber.toLowerCase().includes(term) ||
        l.phoneNumber.toLowerCase().includes(term)
      );
    }

    setCurrentPage(1);
    setFilteredLogs(results);
  }, [searchTerm, statusFilter, callTypeFilter, logs]);

  useEffect(() => { fetchAllCallLogs(); }, []);
  useEffect(() => { setCurrentPage(1); }, [perPage]);

  const logsPerPage = parseInt(perPage);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const currentLogs = filteredLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

  const getStatusBadge = (status) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full uppercase';
    switch (status.toLowerCase()) {
      case 'completed': return `${base} bg-green-100 text-green-800`;
      case 'no-answer':
      case 'failed':
      case 'busy':
      case 'canceled': return `${base} bg-red-100 text-red-800`;
      case 'ringing': case 'initiated': return `${base} bg-yellow-100 text-yellow-800`;
      default: return `${base} bg-gray-100 text-gray-700`;
    }
  };

  const statusOptions = ['All Status', 'accepted', 'no-answer', 'ringing', 'busy', 'failed', 'canceled'];
  const typeOptions = ['All Types', 'Inbound', 'Outbound'];
  const perPageOptions = ['10', '25', '50'];

  return (
    <div
      className="p-8 bg-gray-50 flex-grow overflow-y-auto"
      style={{ height: '100vh', paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, marginTop: `-${NAVBAR_HEIGHT_PX}px` }}
    >
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Call Log Management</h1>
      <p className="text-gray-500 mb-6 border-b pb-4 text-sm">Monitor and analyze all call activities with detailed insights.</p>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center">
          <ExclamationCircleIcon className="w-6 h-6 mr-3" />
          <p>{error}</p>
        </div>
      )}

      {redialMessage && (
        <div className={`border-l-4 p-4 mb-6 rounded-md flex items-center ${redialMessage.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          {redialMessage.type === 'success' ? <CheckCircleIcon className="w-6 h-6 mr-3" /> : <ExclamationCircleIcon className="w-6 h-6 mr-3" />}
          <p>{redialMessage.text}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title={<span className="text-purple-600 font-bold">TOTAL CALLS</span>}
          value={stats.totalCalls}
          subtitle="All calls"
          change="This month"
          icon={<PhoneIcon className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
          borderColor="bg-purple-500"
          isLoading={isLoading}
        />
        <StatsCard
          title={<span className="text-green-600 font-bold">ACCEPTED</span>}
          value={stats.accepted}
          subtitle="Answered"
          change="Answered"
          icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
          borderColor="bg-green-500"
          isLoading={isLoading}
        />
        <StatsCard
          title={<span className="text-yellow-600 font-bold">MISSED CALLS</span>}
          value={stats.missed}
          subtitle="No answer"
          change="Missed"
          icon={<XCircleIcon className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-100"
          borderColor="bg-yellow-500"
          isLoading={isLoading}
        />
        <StatsCard
          title={<span className="text-pink-600 font-bold">AVG DURATION</span>}
          value={stats.avgDuration}
          subtitle="Avg answered time"
          change="Duration"
          icon={<ClockIcon className="w-6 h-6 text-pink-600" />}
          color="bg-pink-100"
          borderColor="bg-pink-500"
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Search Calls</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                disabled={isLoading}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" disabled={isLoading}>
              {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Call Type</label>
            <select value={callTypeFilter} onChange={e => setCallTypeFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" disabled={isLoading}>
              {typeOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Per Page</label>
            <div className="flex gap-2">
              <select value={perPage} onChange={e => setPerPage(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" disabled={isLoading}>
                {perPageOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <button onClick={fetchAllCallLogs} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" disabled={isLoading}>
                <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden border">
        <h2 className="text-xl font-bold text-gray-800 p-6 border-b">Call History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['S.No', 'Phone Number', 'Type', 'Duration', 'Date & Time', 'Status', 'Recording', 'Redial', 'Delete'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="9" className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : currentLogs.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-10 text-gray-500">No calls found.</td></tr>
              ) : (
                currentLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-gray-700">{(currentPage - 1) * logsPerPage + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{log.phoneNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{log.type}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.durationDisplay}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{log.dateTime}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(log.status)}>{log.status.toUpperCase().replace('-', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 cursor-pointer">{log.recording}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRedial(log)}
                        disabled={redialLoadingId === log.id}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 transition-transform hover:scale-105"
                      >
                        {redialLoadingId === log.id ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PhoneIcon className="w-4 h-4" />}
                        {redialLoadingId === log.id ? 'Calling...' : 'Redial'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="group flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-110"
                        title="Delete Log"
                      >
                        <TrashIcon className="w-4 h-4 transition-transform group-hover:rotate-12" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 text-sm flex justify-between items-center">
          <span>Showing <strong>{(currentPage - 1) * logsPerPage + 1}</strong> to <strong>{Math.min(currentPage * logsPerPage, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> records.</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
            <span className="px-2 py-1 font-bold">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 z-20">
        <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
      </button>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Call Log"
        message="Are you sure you want to delete this call log? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CallHistory;