import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

const API_BASE_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

const VoicemailManagementPage = () => {
  const { isDark } = useTheme();
  const [voicemails, setVoicemails] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Messages');
  const [perPage, setPerPage] = useState(10);
  const [isPlayingId, setIsPlayingId] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [transcriptionModal, setTranscriptionModal] = useState(null);

  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    played: 0,
    avgDuration: '0:00'
  });

  const fetchVoicemails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/voicemails`);
      const data = response.data.voicemails || [];
      setVoicemails(data);
      calculateStats(data);
    } catch (error) {
      console.error("Failed to fetch voicemails:", error);
      setVoicemails([]);
      calculateStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const newMsgs = data.filter(m => m.status === 'New').length;
    const played = data.filter(m => m.status === 'Played').length;

    // Calculate average duration
    let totalSeconds = 0;
    data.forEach(m => {
      if (m.duration) {
        const parts = m.duration.split(':');
        if (parts.length === 2) {
          totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
      }
    });
    const avgSec = total > 0 ? Math.round(totalSeconds / total) : 0;
    const avgDuration = `${Math.floor(avgSec / 60)}:${(avgSec % 60).toString().padStart(2, '0')}`;

    setStats({ total, new: newMsgs, played, avgDuration });
  };

  useEffect(() => {
    fetchVoicemails();

    // Listen for real-time voicemail updates
    socket.on('voicemail_update', (newVoicemail) => {
      console.log('New voicemail received:', newVoicemail);
      fetchVoicemails();
    });

    return () => {
      socket.off('voicemail_update');
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, []);

  useEffect(() => {
    let result = voicemails;

    if (statusFilter !== 'All Messages') {
      result = result.filter(msg => msg.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(msg =>
        msg.fromNumber.includes(lowerTerm) ||
        (msg.transcription && msg.transcription.toLowerCase().includes(lowerTerm))
      );
    }

    setFilteredMessages(result);
  }, [voicemails, statusFilter, searchTerm]);

  const handlePlay = async (id, url) => {
    if (!url) {
      alert('Audio URL not available');
      return;
    }

    if (isPlayingId === id) {
      // Stop current audio
      if (audioPlayer) {
        audioPlayer.pause();
        setAudioPlayer(null);
      }
      setIsPlayingId(null);
    } else {
      // Stop any currently playing audio
      if (audioPlayer) {
        audioPlayer.pause();
      }

      // Create new audio player
      const audio = new Audio(url);
      audio.play();
      setAudioPlayer(audio);
      setIsPlayingId(id);

      // Mark as played
      try {
        await axios.put(`${API_BASE_URL}/voicemails/${id}/mark-played`);
        fetchVoicemails();
      } catch (error) {
        console.error('Failed to mark as played:', error);
      }

      // Auto-stop when finished
      audio.onended = () => {
        setIsPlayingId(null);
        setAudioPlayer(null);
      };
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this voicemail?')) {
      try {
        await axios.delete(`${API_BASE_URL}/voicemails/${id}`);
        setVoicemails(prev => prev.filter(m => m.id !== id));
        calculateStats(voicemails.filter(m => m.id !== id));

        // Stop audio if currently playing
        if (isPlayingId === id && audioPlayer) {
          audioPlayer.pause();
          setAudioPlayer(null);
          setIsPlayingId(null);
        }
      } catch (error) {
        console.error('Failed to delete voicemail:', error);
        alert('Failed to delete voicemail');
      }
    }
  };

  const handleViewTranscription = (msg) => {
    setTranscriptionModal(msg);
  };

  const getStatusBadge = (status) => {
    if (status === 'New') {
      return `px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-800'}`;
    }
    return `px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-800'}`;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`h-1 ${color}`}></div>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
            <h3 className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{isLoading ? '...' : value}</h3>
            {subtitle && <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-8 min-h-screen pt-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Voicemail Management</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage and listen to your voicemails</p>
        </div>
        <button
          onClick={fetchVoicemails}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          <ArrowPathIcon className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="TOTAL MESSAGES"
          value={stats.total}
          subtitle="All voicemails"
          icon={ChatBubbleBottomCenterTextIcon}
          color="bg-indigo-500"
        />
        <StatCard
          title="NEW MESSAGES"
          value={stats.new}
          subtitle="Unheard voicemails"
          icon={ExclamationCircleIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="PLAYED MESSAGES"
          value={stats.played}
          subtitle="Listened"
          icon={CheckCircleIcon}
          color="bg-green-500"
        />
        <StatCard
          title="AVG DURATION"
          value={stats.avgDuration}
          subtitle="Average length"
          icon={ClockIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Controls */}
      <div className={`p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4 justify-between items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone or transcription..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
          >
            <option>All Messages</option>
            <option>New</option>
            <option>Played</option>
          </select>
          <select
            value={perPage}
            onChange={e => setPerPage(Number(e.target.value))}
            className={`px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`shadow-lg rounded-lg overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
              <tr>
                {['#', 'From Number', 'Duration', 'Date & Time', 'Status', 'Audio', 'Transcription', 'Actions'].map(h => (
                  <th key={h} className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {isLoading ? (
                <tr><td colSpan="8" className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : filteredMessages.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-10 text-gray-500">No voicemails found.</td></tr>
              ) : (
                filteredMessages.slice(0, perPage).map((msg, index) => (
                  <tr key={msg.id} className={`transition ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{index + 1}</td>
                    <td className={`px-6 py-4 text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      <PhoneIcon className="w-4 h-4 text-gray-400" /> {msg.fromNumber}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{msg.duration}</td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{msg.dateTime}</td>
                    <td className="px-6 py-4"><span className={getStatusBadge(msg.status)}>{msg.status}</span></td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handlePlay(msg.id, msg.audioUrl)}
                        className={`flex items-center font-medium transition-all ${isPlayingId === msg.id
                          ? 'text-indigo-600 animate-pulse'
                          : isDark ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-600 hover:text-indigo-600'
                          }`}
                      >
                        {isPlayingId === msg.id ? (
                          <><PauseIcon className="w-5 h-5 mr-1" /> Playing...</>
                        ) : (
                          <><PlayIcon className="w-5 h-5 mr-1" /> Play</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleViewTranscription(msg)}
                        className={`flex items-center ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                      >
                        <InformationCircleIcon className="w-5 h-5 mr-1" /> View
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className={`p-2 rounded-full transition ${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-800 hover:bg-red-50'}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcription Modal */}
      {transcriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl max-w-2xl w-full border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Voicemail Transcription</h2>
              <button onClick={() => setTranscriptionModal(null)} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className="text-sm"><strong>From:</strong> {transcriptionModal.fromNumber}</p>
                <p className="text-sm"><strong>Date:</strong> {transcriptionModal.dateTime}</p>
                <p className="text-sm"><strong>Duration:</strong> {transcriptionModal.duration}</p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {transcriptionModal.transcription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoicemailManagementPage;