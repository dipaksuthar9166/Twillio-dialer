// src/pages/AutoMessagesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusIcon,
  ArrowPathIcon,
  ClockIcon,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  TrashIcon,
  PencilIcon,
  InboxStackIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';
import { digitsOnly } from './chatUtils';

const API_BASE_URL = 'http://localhost:3001/api';
const DUMMY_USER_TOKEN = 'SUPER_ADMIN_TOKEN';
const NAVBAR_HEIGHT_PX = 66;
const MAX_SEQUENCE_CHARS = 320;

const getAuthHeaders = () => ({ Authorization: `Bearer ${DUMMY_USER_TOKEN}` });

// --- UTILS & COMPONENTS ---

// CSS Animation Style for the Modal
const modalStyles = `
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-modal-in {
    animation: modalIn 0.2s ease-out forwards;
  }
`;

const formatNextRun = (nextRunAt, status) => {
  if (status === 'completed') {
    return <span className="text-green-700 font-medium">Completed</span>;
  }
  if (status === 'paused') {
    return <span className="text-yellow-700 font-medium">Paused</span>;
  }
  if (!nextRunAt) return 'Not Scheduled';
  return `Next on ${new Date(nextRunAt).toLocaleDateString()} at ${new Date(nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const getStatusBadge = (status) => {
  const base = 'px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide';
  switch (status?.toLowerCase()) {
    case 'active': return `${base} bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800`;
    case 'paused': return `${base} bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800`;
    case 'sent': return `${base} bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800`;
    case 'failed': return `${base} bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800`;
    case 'completed': return `${base} bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600`;
    default: return `${base} bg-gray-100 text-gray-700`;
  }
};

// --- CONFIRMATION MODAL COMPONENT ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden backdrop-blur-sm bg-gray-900/60 transition-all">
      <style>{modalStyles}</style>
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 animate-modal-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-6 text-center">
          <div className={`mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center ${type === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
            <ExclamationTriangleIcon className="w-8 h-8" />
          </div>

          <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
            {title}
          </h3>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            {message}
          </p>

          <div className="flex justify-center items-center gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:ring-4 focus:outline-none transition-all flex items-center shadow-lg ${type === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300 dark:focus:ring-red-900 shadow-red-500/30'
                : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-300 dark:focus:ring-yellow-900 shadow-yellow-500/30'
                }`}
            >
              {isLoading && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
              {type === 'danger' ? "Yes, I'm sure" : "Confirm Action"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HISTORY TABLE COMPONENT ---
const AutoMessageHistoryTable = ({ campaignId, campaignName, onBack, isModal = false }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const url = campaignId
        ? `${API_BASE_URL}/auto-messages/${campaignId}/history`
        : `${API_BASE_URL}/auto-messages/history/all`;

      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(url, { headers: getAuthHeaders() });
        if (res.data.success) {
          setHistory(res.data.history || []);
        } else {
          throw new Error(res.data.message || 'Failed to fetch history');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [campaignId]);

  return (
    <>
      {!isModal && (
        <header className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <InboxStackIcon className="w-6 h-6 text-indigo-600" />
            {campaignName ? `History for: ` : 'All Auto-Message History'}
            {campaignName && <span className="text-indigo-700 dark:text-indigo-400">{campaignName}</span>}
          </h1>
          <button onClick={onBack} className="px-4 py-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors">
            <ArrowPathIcon className="w-5 h-5 -rotate-90" /> Back
          </button>
        </header>
      )}
      <div className={`${isModal ? '' : 'bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700'} overflow-hidden`}>
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
            <ArrowPathIcon className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
            Loading history...
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600 dark:text-red-400">{error}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <InboxStackIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            No history found for this campaign.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">To Number</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sent At</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {history.map((log, index) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{log.contactNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate" title={log.messageBody}>{log.messageBody}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={getStatusBadge(log.status)}>{log.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(log.sentAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// --- HISTORY MODAL COMPONENT ---
const HistoryModal = ({ isOpen, onClose, campaign }) => {
  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden backdrop-blur-sm bg-gray-900/60 transition-all">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 animate-modal-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <InformationCircleIcon className="w-6 h-6 text-indigo-600" />
            Campaign Details: <span className="text-indigo-600 dark:text-indigo-400">{campaign.name}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <AutoMessageHistoryTable campaignId={campaign._id} campaignName={campaign.name} isModal={true} />
        </div>
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const AutoMessagesPage = () => {
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'logs', 'all-logs'
  const [messageName, setMessageName] = useState('');
  const [startDateTime, setStartDateTime] = useState(new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16));
  const [endDateTime, setEndDateTime] = useState('');
  const [messagesSequence, setMessagesSequence] = useState([
    { id: 0, dayName: 'Sunday', sendOnDay: 0, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: false },
    { id: 1, dayName: 'Monday', sendOnDay: 1, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
    { id: 2, dayName: 'Tuesday', sendOnDay: 2, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
    { id: 3, dayName: 'Wednesday', sendOnDay: 3, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
    { id: 4, dayName: 'Thursday', sendOnDay: 4, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
    { id: 5, dayName: 'Friday', sendOnDay: 5, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
    { id: 6, dayName: 'Saturday', sendOnDay: 6, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: false },
  ]);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [availableContactGroups, setAvailableContactGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedGroupContacts, setSelectedGroupContacts] = useState([]);
  const [isGroupContactsLoading, setIsGroupContactsLoading] = useState(false);
  const [recipientType, setRecipientType] = useState('group');
  const [singlePhoneNumber, setSinglePhoneNumber] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [autoMessages, setAutoMessages] = useState([]);
  const [stats, setStats] = useState({ totalAutoMessages: 0, activeMessages: 0, contactGroups: 0, totalSent: 0 });
  const [error, setError] = useState(null);
  const [viewingLogsFor, setViewingLogsFor] = useState(null);

  // New State for Modals
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'delete', // 'delete' or 'status'
    itemId: null,
    itemData: null,
    isLoading: false
  });

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryCampaign, setSelectedHistoryCampaign] = useState(null);

  const openHistoryModal = (campaign) => {
    setSelectedHistoryCampaign(campaign);
    setHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setHistoryModalOpen(false);
    setSelectedHistoryCampaign(null);
  };

  const fetchAutoMessages = async () => {
    setIsDashboardLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/auto-messages`, { headers: getAuthHeaders() });
      setAutoMessages(res.data.messages || []);
      setStats(res.data.stats || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const fetchTemplatesAndGroups = async () => {
    setIsFormLoading(true);
    setError(null);
    try {
      const [tempRes, groupRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/templates/all`, { headers: getAuthHeaders() }),
        axios.get(`${API_BASE_URL}/contact-groups/all`, { headers: getAuthHeaders() }),
      ]);
      setAvailableTemplates(tempRes.data.templates || tempRes.data || []);
      setAvailableContactGroups(groupRes.data.groups || groupRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsFormLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') fetchAutoMessages();
    if (view === 'create' || view === 'edit') fetchTemplatesAndGroups();
  }, [view]);

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedGroupContacts([]);
      return;
    }

    const fetchGroupContacts = async () => {
      setIsGroupContactsLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/auto-messages/group-contacts/${selectedGroup}`, {
          headers: getAuthHeaders(),
        });
        if (res.data.success) {
          setSelectedGroupContacts(res.data.contacts || []);
        }
      } catch (err) {
        console.error("Failed to fetch group contacts:", err);
        setSelectedGroupContacts([]);
      } finally {
        setIsGroupContactsLoading(false);
      }
    };

    fetchGroupContacts();
  }, [selectedGroup]);

  const resetForm = () => {
    setMessageName('');
    setStartDateTime('');
    setEndDateTime('');
    setMessagesSequence([
      { id: 0, dayName: 'Sunday', sendOnDay: 0, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: false },
      { id: 1, dayName: 'Monday', sendOnDay: 1, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
      { id: 2, dayName: 'Tuesday', sendOnDay: 2, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
      { id: 3, dayName: 'Wednesday', sendOnDay: 3, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
      { id: 4, dayName: 'Thursday', sendOnDay: 4, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
      { id: 5, dayName: 'Friday', sendOnDay: 5, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: true },
      { id: 6, dayName: 'Saturday', sendOnDay: 6, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: false },
    ]);
    setSelectedGroup('');
    setRecipientType('group');
    setSinglePhoneNumber('');
    setEditingId(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setView('create');
  };

  const handleEdit = (msg) => {
    setMessageName(msg.name || '');
    setStartDateTime(msg.startDateTime ? new Date(msg.startDateTime).toISOString().slice(0, 16) : '');
    setEndDateTime(msg.endDateTime ? new Date(msg.endDateTime).toISOString().slice(0, 16) : '');
    setRecipientType(msg.targetPhoneNumber ? 'single' : 'group');
    setSinglePhoneNumber(msg.targetPhoneNumber || '');
    setSelectedGroup(msg.contactGroupId?._id || '');

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const newSequence = weekDays.map((dayName, index) => {
      const savedDay = (msg.sequence || []).find(s => s.sendOnDay === index);
      if (savedDay) {
        return {
          id: index,
          dayName,
          sendOnDay: index,
          timeOfDay: savedDay.timeOfDay || '09:00',
          template: savedDay.isTemplate ? savedDay.messageBody : '',
          content: !savedDay.isTemplate ? savedDay.messageBody : '',
          showPreview: false,
          enabled: true,
        };
      }
      return { id: index, dayName, sendOnDay: index, timeOfDay: '09:00', template: '', content: '', showPreview: false, enabled: false };
    });
    setMessagesSequence(newSequence);
    setEditingId(msg._id);
    setView('edit');
  };

  // --- REPLACED HANDLE DELETE WITH MODAL ---
  const initiateDelete = (msg) => {
    setModalState({
      isOpen: true,
      type: 'delete',
      itemId: msg._id,
      itemData: msg,
      isLoading: false
    });
  };

  const confirmDelete = async () => {
    setModalState(prev => ({ ...prev, isLoading: true }));
    try {
      await axios.delete(`${API_BASE_URL}/auto-messages/${modalState.itemId}`, { headers: getAuthHeaders() });
      setAutoMessages(prev => prev.filter(m => m._id !== modalState.itemId));
      closeModal();
      // Optional: Add a toast notification here
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // --- REPLACED HANDLE STATUS WITH MODAL ---
  const initiateStatusToggle = (msg) => {
    setModalState({
      isOpen: true,
      type: 'status',
      itemId: msg._id,
      itemData: msg,
      isLoading: false
    });
  };

  const confirmStatusToggle = async () => {
    const id = modalState.itemId;
    const currentStatus = modalState.itemData.status;

    setModalState(prev => ({ ...prev, isLoading: true }));

    try {
      const res = await axios.patch(
        `${API_BASE_URL}/auto-messages/${id}/status`,
        { status: currentStatus === 'active' ? 'paused' : 'active' },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        setAutoMessages(prev =>
          prev.map(m => (m._id === id ? { ...m, status: m.status === 'active' ? 'paused' : 'active' } : m))
        );
        closeModal();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: 'delete', itemId: null, itemData: null, isLoading: false });
  };

  const handleTogglePreview = (id) => {
    setMessagesSequence(prev =>
      prev.map(m => (m.id === id ? { ...m, showPreview: !m.showPreview } : m))
    );
  };

  const handleBack = () => {
    resetForm();
    setView('list');
    setViewingLogsFor(null);
  };

  const handleSequenceChange = (id, field, value) => {
    setMessagesSequence(prev =>
      prev.map(msg =>
        msg.id === id
          ? {
            ...msg,
            [field]: value,
            ...(field === 'template' && value ? { content: '' } : {}),
            ...(field === 'content' && value ? { template: '' } : {}),
          }
          : msg
      )
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!messageName || !startDateTime) {
      alert('Fill all required fields');
      return;
    }
    if (recipientType === 'group' && !selectedGroup) {
      alert('Please select a Contact Group.');
      return;
    }
    if (recipientType === 'single' && (!singlePhoneNumber || digitsOnly(singlePhoneNumber).length < 10)) {
      alert('Please enter a valid single phone number (min 10 digits).');
      return;
    }

    const enabledMessages = messagesSequence.filter(m => m.enabled);
    if (enabledMessages.length === 0) {
      alert('Please enable and configure at least one day in the sequence.');
      return;
    }
    const hasEmptyMessage = enabledMessages.some(m => !m.template && !m.content);
    if (hasEmptyMessage) {
      alert('Each message must have content or template');
      return;
    }

    const payload = {
      name: messageName,
      recipientType,
      contactGroupId: recipientType === 'group' ? selectedGroup : undefined,
      targetPhoneNumber: recipientType === 'single' ? digitsOnly(singlePhoneNumber) : undefined,
      startDateTime,
      endDateTime: endDateTime || null,
      sequence: enabledMessages.map(m => ({
        sendOnDay: Number(m.sendOnDay),
        timeOfDay: m.timeOfDay,
        messageBody: m.content || m.template,
        isTemplate: !!m.template,
      })),
    };

    try {
      let res;
      if (editingId) {
        res = await axios.put(`${API_BASE_URL}/auto-messages/${editingId}`, payload, { headers: getAuthHeaders() });
      } else {
        res = await axios.post(`${API_BASE_URL}/auto-messages/create`, payload, { headers: getAuthHeaders() });
      }
      if (res.data.success) {
        alert(editingId ? 'Updated!' : 'Created!');
        handleBack();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSave} className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {editingId ? 'Edit' : 'Create'} Auto Message
        </h1>
        <button type="button" onClick={handleBack} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center shadow-sm">
          <ArrowPathIcon className="w-4 h-4 rotate-90 mr-2" /> Back
        </button>
      </div>

      {isFormLoading ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow">
          <ArrowPathIcon className="w-10 h-10 inline-block animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-500">Loading Configuration...</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 pb-2 border-b dark:border-gray-700">
              <EnvelopeIcon className="w-5 h-5 text-indigo-600" /> Campaign Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Message Name *</label>
                <input type="text" value={messageName} onChange={e => setMessageName(e.target.value)} placeholder="e.g. Weekly Promo" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target Group *</label>
                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" required>
                  <option value="">Select a Contact Group</option>
                  {availableContactGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.totalContacts || 0} contacts)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date & Time *</label>
                <input type="datetime-local" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date & Time (Optional)</label>
                <input type="datetime-local" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" min={startDateTime} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-8 border-b dark:border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-purple-600" />
                Message Sequence
              </h2>
              <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {messagesSequence.filter(m => m.enabled).length} Active Days
              </span>
            </div>

            <div className="space-y-6">
              {messagesSequence.map(msg => (
                <div key={msg.id} className={`p-5 border rounded-xl transition-all duration-200 ${msg.enabled ? 'bg-white border-purple-200 shadow-md dark:bg-gray-700 dark:border-purple-900' : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <label htmlFor={`enable-${msg.id}`} className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id={`enable-${msg.id}`}
                          checked={msg.enabled}
                          onChange={e => handleSequenceChange(msg.id, 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                      </label>
                      <span className={`font-bold text-sm ${msg.enabled ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>{msg.dayName}</span>
                    </div>
                    {msg.enabled && (
                      <button
                        type="button"
                        onClick={() => handleTogglePreview(msg.id)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 flex items-center gap-1 text-xs font-medium"
                      >
                        {msg.showPreview ? <><EyeSlashIcon className="w-4 h-4" /> Hide</> : <><EyeIcon className="w-4 h-4" /> Preview</>}
                      </button>
                    )}
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-start transition-opacity duration-300 ${!msg.enabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Send Time</label>
                      <input type="time" value={msg.timeOfDay} onChange={e => handleSequenceChange(msg.id, 'timeOfDay', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white" required />
                    </div>

                    <div className="md:col-span-9 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Use Template</label>
                          <select value={msg.template} onChange={e => handleSequenceChange(msg.id, 'template', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-white disabled:bg-gray-100 disabled:text-gray-400" disabled={!!msg.content}>
                            <option value="">-- Choose Template --</option>
                            {availableTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Or Write Custom</label>
                          <div className="relative">
                            <textarea
                              value={msg.content}
                              onChange={e => handleSequenceChange(msg.id, 'content', e.target.value)}
                              rows={1}
                              maxLength={MAX_SEQUENCE_CHARS}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none dark:bg-gray-600 dark:border-gray-500 dark:text-white disabled:bg-gray-100 disabled:text-gray-400"
                              disabled={!!msg.template}
                              placeholder="Type message content here..."
                            />
                          </div>
                        </div>
                      </div>

                      {msg.showPreview && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200 shadow-inner">
                          <strong className="block text-xs text-blue-500 mb-1 uppercase tracking-wide">Message Preview</strong>
                          {msg.content || msg.template || <em className="text-gray-400 text-xs">No content added yet</em>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t dark:border-gray-700 pt-6">
            <button type="button" onClick={handleBack} className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 font-medium shadow-lg shadow-purple-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> {editingId ? 'Update Campaign' : 'Save Campaign'}
            </button>
          </div>
        </>
      )}
    </form>
  );

  const renderContent = () => {
    if (view === 'create' || view === 'edit') return renderForm();
    if (view === 'all-logs' || (view === 'logs' && viewingLogsFor)) {
      return (
        <AutoMessageHistoryTable
          campaignId={viewingLogsFor?._id}
          campaignName={viewingLogsFor?.name}
          onBack={handleBack}
        />
      );
    }

    return (
      <>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Auto Messages</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Automate your customer engagement with scheduled message sequences.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateNew} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
              <PlusIcon className="w-5 h-5" /> Create New
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={<span className="text-indigo-600 font-bold">TOTAL CAMPAIGNS</span>}
            value={stats.totalAutoMessages}
            subtitle="All time"
            icon={<EnvelopeIcon className="w-6 h-6 text-indigo-600" />}
            color="bg-indigo-50"
            borderColor="bg-indigo-500"
            isLoading={isDashboardLoading}
          />
          <StatsCard
            title={<span className="text-green-600 font-bold">ACTIVE</span>}
            value={stats.activeMessages}
            subtitle="Running now"
            icon={<PlayCircleIcon className="w-6 h-6 text-green-600" />}
            color="bg-green-50"
            borderColor="bg-green-500"
            isLoading={isDashboardLoading}
          />
          <StatsCard
            title={<span className="text-purple-600 font-bold">GROUPS</span>}
            value={stats.contactGroups}
            subtitle="Targeted"
            icon={<UserGroupIcon className="w-6 h-6 text-purple-600" />}
            color="bg-purple-50"
            borderColor="bg-purple-500"
            isLoading={isDashboardLoading}
          />
          <StatsCard
            title={<span className="text-blue-600 font-bold">DELIVERED</span>}
            value={stats.totalSent}
            subtitle="Messages sent"
            icon={<PaperAirplaneIcon className="w-6 h-6 text-blue-600" />}
            color="bg-blue-50"
            borderColor="bg-blue-500"
            isLoading={isDashboardLoading}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-r-md flex items-center shadow-sm">
            <ExclamationTriangleIcon className="w-6 h-6 mr-3 flex-shrink-0" />
            <p className="font-medium">{error}</p>
            <button onClick={fetchAutoMessages} className="ml-auto flex items-center gap-1 text-red-600 dark:text-red-200 hover:underline">
              <ArrowPathIcon className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {isDashboardLoading ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col items-center justify-center">
              <ArrowPathIcon className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading your campaigns...</p>
            </div>
          </div>
        ) : autoMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-full mb-4">
              <EnvelopeIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Auto Messages Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center">Create your first automated message sequence to start engaging with your customers automatically.</p>
            <button onClick={handleCreateNew} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-md transition-all">
              Create First Campaign
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Next Run</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {autoMessages.map((msg) => (
                    <tr key={msg._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{msg.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Created on {new Date(msg.createdAt || Date.now()).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(msg.status)}>{msg.status || 'inactive'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="w-4 h-4 text-gray-400" />
                          {msg.contactGroupId?.name || <span className="text-gray-400 italic">No Group</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatNextRun(msg.nextRunAt, msg.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openHistoryModal(msg)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg dark:hover:bg-gray-600 dark:hover:text-indigo-400 transition-colors"
                            title="View Info & History"
                          >
                            <InformationCircleIcon className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => initiateStatusToggle(msg)}
                            className={`p-2 rounded-lg transition-colors ${msg.status === 'active'
                              ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-gray-600'
                              : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-gray-600'
                              }`}
                            title={msg.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                          >
                            {msg.status === 'active' ? <PauseCircleIcon className="w-5 h-5" /> : <PlayCircleIcon className="w-5 h-5" />}
                          </button>

                          <button
                            onClick={() => handleEdit(msg)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-gray-600 dark:hover:text-blue-400 transition-colors"
                            title="Edit Configuration"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => initiateDelete(msg)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-gray-600 dark:hover:text-red-400 transition-colors"
                            title="Delete Permanently"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="p-6 md:p-8 bg-gray-50 dark:bg-gray-900 flex-grow overflow-y-auto"
      style={{ height: '100vh', paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, marginTop: `-${NAVBAR_HEIGHT_PX}px` }}
    >
      {renderContent()}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.type === 'delete' ? confirmDelete : confirmStatusToggle}
        isLoading={modalState.isLoading}
        type={modalState.type === 'delete' ? 'danger' : 'warning'}
        title={modalState.type === 'delete' ? "Delete Auto Message?" : (modalState.itemData?.status === 'active' ? "Pause Campaign?" : "Resume Campaign?")}
        message={
          modalState.type === 'delete'
            ? `Are you sure you want to delete "${modalState.itemData?.name}"? This action cannot be undone and all scheduled messages will be cancelled.`
            : `Are you sure you want to ${modalState.itemData?.status === 'active' ? 'pause' : 'resume'} the campaign "${modalState.itemData?.name}"?`
        }
      />

      <HistoryModal
        isOpen={historyModalOpen}
        onClose={closeHistoryModal}
        campaign={selectedHistoryCampaign}
      />

      <button className="fixed bottom-8 right-8 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-transform duration-200 z-40">
        <ChatBubbleBottomCenterTextIcon className="w-7 h-7" />
      </button>
    </div>
  );
};

export default AutoMessagesPage;