// InboxMessage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 🟢 ADD: useNavigate
import { useNotification } from '../context/NotificationContext';
import {
  MagnifyingGlassIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  DocumentTextIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  MicrophoneIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  UsersIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  PlusIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { EllipsisVerticalIcon as EllipsisVerticalSolid } from '@heroicons/react/20/solid';
import axios from 'axios';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import {
  ProfileDrawer,
  WhatsAppSettingsDrawer,
  StarredMessagesDrawer,
  ArchivedChatsDrawer,
  StatusDrawer
} from '../components/WhatsAppDrawers';
import {
  getAuthHeaders,
  digitsOnly,
  last10,
  compareNumbers,
  formatMessageTime,
  formatTimeOnly,
  relativeLastSeen,
  normalizeAndSortMessages
} from './chatUtils';

const API_BASE_URL = 'http://localhost:3001/api';
const SOCKET_SERVER_URL = 'http://localhost:3001';
let socket;

// --- Theme Colors (Light & Dark) ---
// Using Tailwind classes directly in components for better switching

const InboxTabs = ({ activeTab, setActiveTab, unreadCount }) => (
  <div className="flex bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#2a3942]">
    <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'all' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]'}`}>All</button>
    <button onClick={() => setActiveTab('unread')} className={`flex-1 py-3 text-sm font-medium relative transition-all ${activeTab === 'unread' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]'}`}>
      Unread
      {unreadCount > 0 && <span className="absolute top-2 right-4 bg-[#00a884] text-white dark:text-[#111b21] text-xs font-bold rounded-full px-1.5 py-0.5 min-w-5 text-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
    <button onClick={() => setActiveTab('read')} className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'read' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]'}`}>Read</button>
  </div>
);

const StatusTicks = ({ status }) => {
  if (!status) return null;
  const normalized = status.toLowerCase();

  if (['pending', 'queued', 'sending'].includes(normalized)) {
    return (
      <svg className="w-3 h-3 ml-0.5 text-gray-400 dark:text-[#8696a0]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.536-3.536A8 8 0 114 12z"></path>
      </svg>
    );
  }

  if (['failed', 'error'].includes(normalized)) {
    return (
      <svg className="w-3 h-3 ml-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  }

  if (normalized === 'sent') {
    return (
      <svg className="w-3 h-3 ml-0.5 text-gray-400 dark:text-[#8696a0]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
      </svg>
    );
  }

  const isRead = normalized === 'read';
  return (
    <svg className={`w-3 h-3 ml-0.5 ${isRead ? 'text-[#53bdeb]' : 'text-gray-400 dark:text-[#8696a0]'}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
      <path d="M3.293 5.293a1 1 0 010 1.414l4 4a1 1 0 01-1.414 1.414L1.293 7.707a1 1 0 011.414-1.414L3 5.586l-.707-.707z"></path>
    </svg>
  );
};

const MessageBubble = ({ message, onRightClick }) => {
  const isSelf = message.sender === 'self';
  const bubbleClass = isSelf
    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] self-end rounded-lg rounded-tr-none shadow-sm'
    : 'bg-white dark:bg-[#202c33] self-start rounded-lg rounded-tl-none shadow-sm';

  return (
    <div
      className={`flex flex-col mb-1 ${isSelf ? 'items-end' : 'items-start'} group`}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick(e, message);
      }}
    >
      <div className={`relative max-w-sm md:max-w-xl px-2 py-1 flex flex-col ${bubbleClass}`}>
        {/* Media */}
        {message.media_url && (
          <div className="mb-1">
            {message.media_type?.startsWith('image/') ? (
              <img src={message.media_url} alt="Media" className="max-w-full rounded-lg cursor-pointer" onClick={() => window.open(message.media_url, '_blank')} />
            ) : message.media_type?.startsWith('video/') ? (
              <video controls className="max-w-full rounded-lg">
                <source src={message.media_url} type={message.media_type} />
              </video>
            ) : (
              <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#53bdeb] underline p-2 bg-black/10 rounded">
                <DocumentTextIcon className="w-6 h-6" />
                <span>Document</span>
              </a>
            )}
          </div>
        )}

        {/* Text */}
        {message.text && (
          <p className={`text-[14.2px] leading-[19px] text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap break-words px-1 ${message.is_deleted ? 'italic text-[#667781] dark:text-[#8696a0]' : ''}`}>
            {message.is_deleted ? 'This message was deleted' : message.text}
          </p>
        )}

        {/* Time & Status */}
        <div className="flex items-center justify-end gap-1 mt-1 select-none">
          <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">{formatTimeOnly(message.sent_at)}</span>
          {isSelf && <StatusTicks status={message.status} />}
        </div>
      </div>
    </div>
  );
};

const DateSeparator = ({ date }) => (
  <div className="flex justify-center my-3 sticky top-2 z-10">
    <span className="bg-[#f0f2f5] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm uppercase">
      {date}
    </span>
  </div>
);

const Drawer = ({ isOpen, onClose, title, children, position = 'left' }) => {
  if (!isOpen) return null;
  const baseClass = "absolute top-0 bottom-0 z-50 bg-white dark:bg-[#111b21] flex flex-col border-r border-gray-200 dark:border-[#2a3942] shadow-2xl";
  const posClass = position === 'left' ? "left-0 w-full md:w-[400px]" : "right-0 w-full md:w-[400px] border-l";
  const animClass = position === 'left'
    ? "animate-slideInLeft"
    : "animate-slideInRight";

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className={`${baseClass} ${posClass} ${animClass}`}>
        <div className="h-[108px] bg-[#008069] flex items-end p-4 text-white shrink-0">
          <div className="flex items-center gap-4 mb-1">
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-medium">{title}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] dark:bg-[#111b21] custom-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};

const ContactInfo = ({ contact, onClose }) => {
  if (!contact) return null;
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white dark:bg-[#111b21] p-6 flex flex-col items-center shadow-sm mb-2">
        <div className="w-48 h-48 bg-[#dfe3e5] dark:bg-[#6a7175] rounded-full flex items-center justify-center text-gray-600 dark:text-[#d1d7db] font-bold text-6xl mb-4">
          {(contact.name?.[0] || '#').toUpperCase()}
        </div>
        <h2 className="text-2xl text-[#111b21] dark:text-[#e9edef] font-normal">{contact.name}</h2>
        <p className="text-lg text-[#667781] dark:text-[#8696a0] mt-1">{contact.number}</p>
      </div>

      <div className="bg-white dark:bg-[#111b21] p-4 shadow-sm mb-2">
        <h3 className="text-sm text-[#667781] dark:text-[#8696a0] mb-2">About</h3>
        <p className="text-[#111b21] dark:text-[#e9edef]">Hey there! I am using WhatsApp.</p>
      </div>

      <div className="bg-white dark:bg-[#111b21] p-4 shadow-sm flex-1">
        <h3 className="text-sm text-[#667781] dark:text-[#8696a0] mb-4">Media, links and docs</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <div className="w-20 h-20 bg-gray-200 dark:bg-[#202c33] rounded flex items-center justify-center text-xs text-gray-500">No media</div>
        </div>
      </div>
    </div>
  );
};

const InboxMessage = () => {
  const navigate = useNavigate(); // 🟢 ADD: useNavigate hook
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Drawers State
  const [leftDrawer, setLeftDrawer] = useState(null); // 'newChat', 'profile', 'communities', 'status'
  const [rightDrawer, setRightDrawer] = useState(null); // 'contactInfo', 'searchMessage'

  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [senderNumber, setSenderNumber] = useState(null);

  const [editingContact, setEditingContact] = useState({ name: '', number: '' });

  const [contextMenu, setContextMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  const { addNotification } = useNotification();
  const [presenceMap, setPresenceMap] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [searchInChatTerm, setSearchInChatTerm] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newContactName, setNewContactName] = useState(''); // 🟢 ADD: Contact name for new contact
  const [twilioBalance, setTwilioBalance] = useState(0);

  const messagesEndRef = useRef(null);
  const senderNumberRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isCurrentlyTypingRef = useRef(false);
  const chatMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { senderNumberRef.current = senderNumber; }, [senderNumber]);
  useEffect(() => { selectedConversationRef.current = selectedConversation; }, [selectedConversation]);

  // 🟢 ADD: Fetch contacts from API
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/twilio/subscriptions`, { headers: getAuthHeaders() });
        if (res.data.success) {
          setTwilioBalance(res.data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };
    fetchBalance();

    const fetchContacts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/contacts`, { headers: getAuthHeaders() });
        if (response.data && Array.isArray(response.data)) {
          setContacts(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      }
    };
    fetchContacts();
  }, []);

  const updateMessageStatuses = useCallback(async (sids, status) => {
    if (!status || !Array.isArray(sids) || sids.length === 0) return;
    try {
      await axios.post(`${API_BASE_URL}/messages/status-update`, { sids, status }, { headers: getAuthHeaders() });
    } catch (error) {
      console.warn('Failed to sync message status', error);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) setShowChatMenu(false);
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const unreadCount = conversations.reduce((acc, conv) => acc + (conv.unread || 0), 0);

  const getFilteredConversations = () => {
    let filtered = conversations;
    if (activeTab === 'unread') filtered = filtered.filter(c => (c.unread || 0) > 0);
    else if (activeTab === 'read') filtered = filtered.filter(c => (c.unread || 0) === 0 && c.lastMessage);
    return filtered.filter(c =>
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.number || '').includes(searchTerm)
    );
  };

  const setPresenceFor = (number, info) => {
    const k = last10(number);
    if (!k) return;
    setPresenceMap(prev => ({ ...prev, [k]: { ...(prev[k] || {}), ...info } }));
  };

  const setTypingFor = (number, isTyping) => {
    const k = last10(number);
    if (!k) return;
    setTypingMap(prev => ({ ...prev, [k]: isTyping }));
  };

  const fetchPresenceFallback = async (number) => {
    try {
      const cleaned = digitsOnly(number);
      if (!cleaned) return;
      const res = await axios.get(`${API_BASE_URL}/presence/${encodeURIComponent(cleaned)}`, { headers: getAuthHeaders() });
      const data = res.data || {};
      setPresenceFor(cleaned, { online: !!data.online, lastSeen: data.lastSeen || null });
    } catch (e) { }
  };

  const handleNewIncomingMessage = useCallback((data) => {
    const id = data.id || data.sid || data.sms_sid || data.message_sid || `tmp_${Date.now()}`;
    const from = data.from_number || data.from || '';
    const text = data.message || data.body || '';
    const sentAt = data.sent_at || new Date().toISOString();

    updateConversationList(from, text, sentAt, true);

    addNotification({
      type: 'message',
      title: `New Message from ${from}`,
      message: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
    });

    if (selectedConversationRef.current && compareNumbers(from, selectedConversationRef.current.number)) {
      const readSids = [];
      setMessages((prevMessages) => {
        const acknowledged = prevMessages.map((msg) => {
          if (msg.sender === 'self' && msg.status !== 'read') {
            if (msg.sid) readSids.push(msg.sid);
            return { ...msg, status: 'read', read_at: new Date().toISOString() };
          }
          return msg;
        });

        if (acknowledged.some((m) => m.id === id)) {
          return acknowledged;
        }

        const newMessagePayload = {
          id,
          sid: id,
          text,
          from,
          to: data.to_number || data.to || '',
          sent_at: sentAt,
          sender: 'other',
          type: data.type || 'sms',
          media_url: data.media_url,
          media_type: data.media_type,
        };
        return normalizeAndSortMessages([...acknowledged, newMessagePayload], senderNumberRef.current);
      });
      if (readSids.length) updateMessageStatuses(readSids, 'read');
    }
  }, [addNotification, updateMessageStatuses]);

  const updateConversationList = (fromNum, text, isoTime, incrementUnread = false) => {
    const cleanNum = digitsOnly(fromNum);
    setConversations(prev => {
      const isForCurrentChat = selectedConversationRef.current && compareNumbers(selectedConversationRef.current.number, cleanNum);
      const existingIndex = prev.findIndex(c => compareNumbers(c.number, cleanNum));

      const unreadIncrement = incrementUnread && !isForCurrentChat ? 1 : 0;

      if (existingIndex > -1) {
        const updatedConv = {
          ...prev[existingIndex],
          lastMessage: text.slice(0, 47) + '...',
          timestamp: formatMessageTime(isoTime),
          time: isoTime,
          unread: (prev[existingIndex].unread || 0) + unreadIncrement,
        };
        const rest = prev.filter((_, i) => i !== existingIndex);
        return [updatedConv, ...rest];
      } else {
        const newConv = { id: `conv_${cleanNum}`, name: cleanNum, number: cleanNum, lastMessage: text.slice(0, 47) + '...', timestamp: formatMessageTime(isoTime), time: isoTime, unread: 1 };
        return [newConv, ...prev];
      }
    });
  };

  useEffect(() => {
    socket = io(SOCKET_SERVER_URL, {
      auth: { token: localStorage.getItem('userToken') },
      transports: ['websocket']
    });

    const onConnect = () => {
      setSocketConnected(true);
      if (senderNumberRef.current) socket.emit('register', { phone: senderNumberRef.current });
      const uid = localStorage.getItem('userId');
      if (uid) socket.emit('register', { userId: uid });
      if (selectedConversationRef.current?.number) {
        const num = digitsOnly(selectedConversationRef.current.number);
        if (num) socket.emit('presence_subscribe', { number: num });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('presence', (p) => setPresenceFor(p.number || p.phone, { online: !!p.online, lastSeen: p.lastSeen }));

    socket.on('typing_start', (p) => setTypingFor(p.number || p.from, true));
    socket.on('typing_stop', (p) => setTypingFor(p.number || p.from, false));
    socket.on('typing', (p) => setTypingFor(p.number || p.from, !!p.typing));

    socket.on('incoming_whatsapp', handleNewIncomingMessage);
    socket.on('new_message', handleNewIncomingMessage);
    socket.on('incoming_message', handleNewIncomingMessage);
    const handleStatusUpdate = ({ sid, status }) => {
      if (!sid) return;
      setMessages(prev => prev.map(m => (m.sid === sid ? { ...m, status: status || m.status } : m)));
    };
    socket.on('message_status_update', handleStatusUpdate);

    socket.on('message_deleted', ({ sid }) => {
      setMessages(prev => prev.map(m =>
        m.id === sid ? { ...m, text: 'This message was deleted', is_deleted: true, media_url: null } : m
      ));
    });

    return () => {
      socket.offAny();
      socket.disconnect();
      setSocketConnected(false);
    };
  }, [handleNewIncomingMessage]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/from-numbers`, { headers: getAuthHeaders() })
      .then(res => {
        const val = res.data?.[0]?.phoneNumber ?? res.data?.[0] ?? null;
        setSenderNumber(val);
        senderNumberRef.current = val;
        if (socket?.connected && val) socket.emit('register', { phone: val });
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/conversations`, { headers: getAuthHeaders() });
        const fetched = (res.data?.conversations || res.data || []).map(c => ({
          ...c,
          number: c.number || c.contactNumber || c.phone || ''
        }));

        // Merge with local conversations
        const localConvs = JSON.parse(localStorage.getItem('localConversations') || '[]');

        setConversations(prev => {
          const map = new Map();
          // Add server conversations first
          fetched.forEach(c => map.set(last10(c.number), c));

          // Add local conversations if not present
          localConvs.forEach(c => {
            const k = last10(c.number);
            if (!map.has(k)) map.set(k, c);
          });

          // Preserve existing local state updates (like unread counts)
          prev.forEach(local => {
            const k = last10(local.number);
            if (k && !map.has(k)) map.set(k, local);
            else if (map.has(k)) {
              const server = map.get(k);
              map.set(k, { ...server, unread: Math.max(server.unread || 0, local.unread || 0) });
            }
          });
          return Array.from(map.values()).slice(0, 200);
        });
      } catch (e) { }
    };
    load();
  }, []);

  const fetchAllContacts = useCallback(async () => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/contacts/all-list`, { headers: getAuthHeaders() });
        const fetched = (res.data?.contacts || res.data || []).map(c => ({
          ...c,
          number: c.number || c.phone || c.contactNumber || ''
        }));
        setContacts(fetched);
      } catch (err) {
        console.error("Failed to fetch contacts list:", err);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!selectedConversation?.number) {
      setMessages([]);
      return;
    }

    axios.get(`${API_BASE_URL}/sms/messages/${selectedConversation.number}`, { headers: getAuthHeaders() })
      .then(res => {
        const normalized = normalizeAndSortMessages((res.data.messages || []).map(m => ({
          ...m,
          from: m.from ?? m.from_number,
          to: m.to ?? m.to_number,
          type: m.type || (m.from?.includes('whatsapp:') ? 'whatsapp' : 'sms'),
          media_url: m.media_url,
          media_type: m.media_type
        })), senderNumberRef.current);
        setMessages(normalized);
        setConversations(prev => prev.map(c => compareNumbers(c.number, selectedConversation.number) ? { ...c, unread: 0 } : c));

        axios.post(`${API_BASE_URL}/conversations/mark-read`,
          { contactNumber: selectedConversation.number },
          { headers: getAuthHeaders() }
        ).catch(err => console.warn("Could not mark as read on server:", err));
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        // Do NOT clear messages on error. Keep existing messages visible if the fetch fails.
        // setMessages([]); 
      });
    const num = digitsOnly(selectedConversation.number);
    if (num && socket?.connected) {
      socket.emit('presence_subscribe', { number: num });
    } else if (num) {
      fetchPresenceFallback(selectedConversation.number);
    }
  }, [selectedConversation, senderNumber, socketConnected]);

  const sendMessage = async () => {
    if (!selectedConversation || !senderNumber) return;
    if (!newMessage.trim() && !selectedFile) return;

    const msgText = newMessage.trim();

    // 🔧 FIX: Destination Number (To) - The person we're sending TO
    let destinationNumber = selectedConversation.number.trim();

    // 🔧 FIX: Sender Number (From) - OUR number (the one sending FROM)
    let fromNumber = senderNumber.trim();

    // Format destination number (recipient)
    if (!destinationNumber.startsWith('whatsapp:')) {
      if (!destinationNumber.startsWith('+')) {
        const digits = digitsOnly(destinationNumber);
        destinationNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;
      }
      destinationNumber = `whatsapp:${destinationNumber}`;
    }

    // Format sender number (our number)
    if (!fromNumber.startsWith('whatsapp:')) {
      if (!fromNumber.startsWith('+')) {
        const digits = digitsOnly(fromNumber);
        fromNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;
      }
      fromNumber = `whatsapp:${fromNumber}`;
    }

    console.log('📤 Sending message:', {
      from: fromNumber,
      to: destinationNumber,
      message: msgText
    });

    const tempId = `tmp_${Date.now()}_${Math.random()}`;
    const nowIso = new Date().toISOString();

    const tempMsg = {
      id: tempId,
      sid: tempId,
      text: msgText,
      sender: 'self',
      sent_at: nowIso,
      media_url: selectedFile ? URL.createObjectURL(selectedFile) : null,
      media_type: selectedFile?.type,
      status: 'pending'
    };
    setMessages(prev => normalizeAndSortMessages([...prev, tempMsg], senderNumberRef.current));
    setNewMessage('');
    setSelectedFile(null);

    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('mediaFile', selectedFile);
        formData.append('toNumber', destinationNumber);  // ✅ Recipient
        formData.append('fromNumber', fromNumber);       // ✅ Our number
        if (msgText) formData.append('message', msgText);

        response = await axios.post(`${API_BASE_URL}/sms/send-media`, formData, {
          headers: getAuthHeaders()
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/sms/send`, {
          toNumber: destinationNumber,   // ✅ Recipient
          message: msgText,
          fromNumber: fromNumber          // ✅ Our number
        }, { headers: getAuthHeaders() });
      }

      if (response.data.success) {
        const sid = response.data.sid || tempId;
        const serverStatus = response.data.messageStatus || 'delivered';
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: sid, sid, status: serverStatus } : m
        ));
        if (sid) updateMessageStatuses([sid], serverStatus);

        setConversations(prev => {
          const convIndex = prev.findIndex(c => compareNumbers(c.number, selectedConversation.number));
          if (convIndex > -1) {
            const updatedConv = {
              ...prev[convIndex],
              lastMessage: response.data.messageBody || msgText || 'Media sent',
              timestamp: formatMessageTime(nowIso),
              time: new Date().toISOString()
            };
            const rest = prev.filter((_, i) => i !== convIndex);
            return [updatedConv, ...rest];
          }
          return prev;
        });
      } else {
        throw new Error(response.data.message || 'Failed to send');
      }
    } catch (err) {
      console.error('Send failed:', err);
      alert('Send failed: ' + (err.response?.data?.message || err.message));
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleUpdateContactName = async () => {
    if (!editingContact.name || !editingContact.number) {
      alert("Name cannot be empty.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/actions/contacts/update`,
        { number: editingContact.number, name: editingContact.name },
        { headers: getAuthHeaders() }
      );

      setConversations(prev => prev.map(c =>
        compareNumbers(c.number, editingContact.number) ? { ...c, name: editingContact.name } : c
      ));
      if (selectedConversation && compareNumbers(selectedConversation.number, editingContact.number)) {
        setSelectedConversation(prev => ({ ...prev, name: editingContact.name }));
      }

      setContacts(prev => prev.map(ct => compareNumbers(ct.number, editingContact.number) ? { ...ct, name: editingContact.name } : ct));

      setShowEditProfileModal(false);
      setEditingContact({ name: '', number: '' });

    } catch (err) {
      alert("Failed to update contact: " + (err.response?.data?.message || err.message));
    }
  };

  // 🟢 ADD: Handle Video Call
  // 🟢 ADD: Handle Video Call
  const handleVideoCall = async () => {
    if (!selectedConversation) return;

    const doctorName = localStorage.getItem('userName') || 'Doctor';
    const patientNumber = selectedConversation.number;

    try {
      const response = await axios.post(`${API_BASE_URL}/consultation/start`, {
        doctorName,
        patientNumber,
        type: 'video'
      }, { headers: getAuthHeaders() });

      if (response.data.success) {
        // Redirect to video room
        const providerParam = response.data.provider ? `&provider=${response.data.provider}` : '';
        navigate(`/video-room/${response.data.roomName}?type=video${providerParam}`);
      } else {
        alert("Failed to start video consultation: " + response.data.message);
      }
    } catch (error) {
      console.error("Error starting video call:", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      alert(`Error starting video call: ${msg}. Please ensure backend is running.`);
    }
  };

  const handleVoiceCall = async () => {
    if (!selectedConversation) return;

    const doctorName = localStorage.getItem('userName') || 'Doctor';
    const patientNumber = selectedConversation.number;

    try {
      const response = await axios.post(`${API_BASE_URL}/consultation/start`, {
        doctorName,
        patientNumber,
        type: 'audio'
      }, { headers: getAuthHeaders() });

      if (response.data.success) {
        // Redirect to video room (which handles audio too)
        const providerParam = response.data.provider ? `&provider=${response.data.provider}` : '';
        navigate(`/video-room/${response.data.roomName}?type=audio${providerParam}`);
      } else {
        alert("Failed to start voice consultation: " + response.data.message);
      }
    } catch (error) {
      console.error("Error starting voice call:", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      alert(`Error starting voice call: ${msg}. Please ensure backend is running.`);
    }
  };

  const handleRightClick = (event, message) => {
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      message: message,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteForMe = () => {
    if (messageToDelete) {
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
    }
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  const handleDeleteForEveryone = async () => {
    if (!messageToDelete || !messageToDelete.id.startsWith('SM')) {
      alert("This message cannot be deleted for everyone (it might be too old or not sent via Twilio).");
      setShowDeleteModal(false);
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/messages/delete`,
        { messageSid: messageToDelete.id },
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      alert("Failed to delete for everyone: " + (err.response?.data?.message || err.message));
    }
    setShowDeleteModal(false);
    setMessageToDelete(null);
  };

  const filteredConversations = getFilteredConversations();

  const deleteConversation = async (conv) => {
    if (!window.confirm(`Delete conversation with ${conv.name || conv.number}?`)) return;
    setConversations(prev => prev.filter(c => !compareNumbers(c.number, conv.number)));
    if (selectedConversation && compareNumbers(selectedConversation.number, conv.number)) {
      setSelectedConversation(null);
      setMessages([]);
    }
    try { await axios.post(`${API_BASE_URL}/conversations/delete`, { numbers: [conv.number] }, { headers: getAuthHeaders() }); } catch (e) { }
  };

  const clearChatForSelected = async () => {
    if (!selectedConversation) return;
    if (!window.confirm(`Clear all messages?`)) return;
    setMessages([]);
    setConversations(prev => prev.map(c => compareNumbers(c.number, selectedConversation.number) ? { ...c, lastMessage: 'Chat cleared' } : c));
    try { await axios.post(`${API_BASE_URL}/sms/messages/clear`, { number: selectedConversation.number }, { headers: getAuthHeaders() }); } catch (e) { }
  };

  const emitTyping = (isTyping) => {
    if (!selectedConversation?.number || !socket?.connected) return;
    const num = digitsOnly(selectedConversation.number);
    if (num) socket.emit('typing', { number: num, typing: !!isTyping });
  };

  const handleInputChange = (text) => {
    setNewMessage(text);
    if (!isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = true;
      emitTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isCurrentlyTypingRef.current = false;
      emitTyping(false);
    }, 2000);
  };

  const renderPresenceStatus = (conv) => {
    const k = last10(conv?.number);
    if (!k) return <span className="text-xs text-[#667781] dark:text-[#8696a0]">Offline</span>;
    const isTyping = typingMap[k];
    const pres = presenceMap[k];

    if (isTyping) return <span className="text-xs italic text-[#00a884] font-medium">typing...</span>;
    if (!socketConnected) return <span className="text-xs text-[#667781] dark:text-[#8696a0]">Connecting...</span>;
    if (pres?.online) return <span className="text-xs text-[#667781] dark:text-[#8696a0]">Online</span>;
    if (pres?.lastSeen) return <span className="text-xs text-[#667781] dark:text-[#8696a0]">Last seen {relativeLastSeen(pres.lastSeen)}</span>;
    return <span className="text-xs text-[#667781] dark:text-[#8696a0]">Offline</span>;
  };

  const localUserName = localStorage.getItem('userName') || 'You';
  const userInitial = (localUserName[0] || 'U').toUpperCase();
  const userStatusText = presenceMap?.[last10(senderNumber)]?.online ? 'Online' : 'Last seen ' + (presenceMap?.[last10(senderNumber)]?.lastSeen ? relativeLastSeen(presenceMap[last10(senderNumber)].lastSeen) : 'recently');

  const pickContactAndStartChat = (contact) => {
    const clean = digitsOnly(contact.number || contact.phone || contact.mobile || '');
    const full = clean.length === 10 ? `+91${clean}` : (contact.number || contact.phone || contact.mobile || '');

    const newConv = {
      id: contact.id || `conv_${full}`,
      name: contact.name || contact.displayName || contact.label || full,
      number: full,
      lastMessage: contact.lastMessage || '',
      time: contact.time || new Date().toISOString(),
    };

    // Save to localStorage to persist across refreshes
    const savedConvs = JSON.parse(localStorage.getItem('localConversations') || '[]');
    if (!savedConvs.some(c => compareNumbers(c.number, newConv.number))) {
      savedConvs.push(newConv);
      localStorage.setItem('localConversations', JSON.stringify(savedConvs));
    }

    setConversations(prev => [newConv, ...prev.filter(c => !compareNumbers(c.number, newConv.number))]);
    setSelectedConversation(newConv);
    setLeftDrawer(null);
    setNewPhoneNumber('');
  };

  // Helper to group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let lastDate = null;

    msgs.forEach(msg => {
      const date = new Date(msg.sent_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      if (date.toDateString() === today.toDateString()) dateStr = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) dateStr = 'Yesterday';

      if (dateStr !== lastDate) {
        groups.push({ type: 'date', date: dateStr });
        lastDate = dateStr;
      }
      groups.push({ type: 'message', ...msg });
    });
    return groups;
  };

  // Filter messages for search
  const filteredMessages = showSearchInChat && searchInChatTerm
    ? messages.filter(m => m.text?.toLowerCase().includes(searchInChatTerm.toLowerCase()))
    : messages;

  const groupedMessages = groupMessagesByDate(filteredMessages);




  // Status Handlers
  const fetchStatuses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/status/list`, { headers: getAuthHeaders() });
      if (response.data.success) {
        setStatusList(response.data.statuses || []);
      }
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
    }
  };

  const handleCreateStatus = async (statusType, content, mediaFile = null) => {
    try {
      const formData = new FormData();
      formData.append('statusType', statusType);

      // Only append content if it exists (for text status or media with caption)
      if (content && content.trim()) {
        formData.append('content', content.trim());
      }

      formData.append('phoneNumber', senderNumber || '+14783393400');
      formData.append('userName', localStorage.getItem('userName') || 'You');

      if (mediaFile) {
        formData.append('mediaFile', mediaFile);
      }

      const response = await axios.post(`${API_BASE_URL}/status/create`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        addNotification({
          type: 'success',
          title: 'Status Posted',
          message: 'Your status has been posted successfully'
        });

        // Refresh status list
        fetchStatuses();
      }
    } catch (err) {
      console.error('Failed to create status:', err);
      alert('Failed to post status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewStatus = (userStatus) => {
    // TODO: Open status viewer modal
    alert(`Viewing status from ${userStatus.userName || userStatus.phoneNumber}\n\nTotal: ${userStatus.totalCount} status updates`);
  };

  // Fetch statuses when modal opens or drawer opens
  useEffect(() => {
    if (showStatusModal || leftDrawer === 'status') {
      fetchStatuses();
    }
  }, [showStatusModal, leftDrawer]);

  // Listen for new status socket events
  useEffect(() => {
    if (socket) {
      socket.on('new_status', (data) => {
        console.log('New status received:', data);
        fetchStatuses();
      });

      socket.on('status_deleted', (data) => {
        console.log('Status deleted:', data);
        fetchStatuses();
      });
    }
  }, [socket]);

  // Audio Recording Handlers
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setAudioRecorder(recorder);
      setIsRecordingAudio(true);

      // Start duration counter
      const startTime = Date.now();
      const interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      recorder.onstop = () => {
        clearInterval(interval);
        setRecordingDuration(0);
      };
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Microphone access denied');
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.stop();
      setIsRecordingAudio(false);
    }
  };

  const cancelAudioRecording = () => {
    if (audioRecorder && audioRecorder.state !== 'inactive') {
      audioRecorder.stop();
      setIsRecordingAudio(false);
      setSelectedFile(null);
      setRecordingDuration(0);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f0f2f5] dark:bg-[#111b21] overflow-hidden">{/* Account for navbar height */}
      {/* Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] h-full flex-col border-r border-gray-200 dark:border-[#2a3942] bg-white dark:bg-[#111b21] relative z-10 overflow-hidden`}>{/* overflow-hidden added */}

        {/* Sidebar Header */}
        <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 py-2 shrink-0">
          {/* User Profile Picture - Clickable */}
          <div
            onClick={() => setLeftDrawer('profile')}
            className="relative cursor-pointer group"
            title="View Profile"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#00a884] to-[#008069] flex items-center justify-center text-white font-bold text-lg transition-transform group-hover:scale-105 shadow-md">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(localUserName || 'User')}&background=00a884&color=fff&bold=true&size=128`}
                alt={localUserName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full items-center justify-center">
                {userInitial}
              </div>
            </div>
            {/* Online Status Indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-white dark:border-[#202c33] rounded-full"></div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-6 text-[#54656f] dark:text-[#aebac1]">
            <button
              onClick={() => setShowCommunityModal(true)}
              title="Communities"
              className="hover:text-[#111b21] dark:hover:text-white transition-colors"
            >
              <UsersIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setLeftDrawer('status')}
              title="Status"
              className="hover:text-[#111b21] dark:hover:text-white transition-colors"
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setLeftDrawer('newChat')}
              title="New Chat"
              className="hover:text-[#111b21] dark:hover:text-white transition-colors"
            >
              <PencilSquareIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setLeftDrawer('menu')}
              title="Menu"
              className="hover:text-[#111b21] dark:hover:text-white transition-colors"
            >
              <EllipsisVerticalIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 bg-white dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942]">
          <div className="flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-3 py-1.5">
            <MagnifyingGlassIcon className="w-5 h-5 text-[#54656f] dark:text-[#8696a0] mr-3" />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="bg-transparent border-none focus:ring-0 text-sm w-full text-[#111b21] dark:text-[#e9edef] placeholder-[#54656f] dark:placeholder-[#8696a0]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <InboxTabs activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="text-center mt-10 text-[#54656f] dark:text-[#8696a0] text-sm">No chats found</div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`flex items-center px-3 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-[#2a3942] ${isSelected ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'}`}
                >
                  <div className="relative">
                    {/* Status Ring & Profile Picture Logic */}
                    {(() => {
                      // Check for active status
                      const userStatus = statusList.find(s => s.phoneNumber === conv.number);
                      const hasStatus = userStatus && userStatus.statuses && userStatus.statuses.length > 0;

                      return (
                        <div
                          className={`relative ${hasStatus ? 'cursor-pointer' : ''}`}
                          onClick={(e) => {
                            if (hasStatus) {
                              e.stopPropagation(); // Prevent opening chat
                              handleViewStatus(userStatus);
                            }
                          }}
                        >
                          {/* Status Ring */}
                          {hasStatus && (
                            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-[#00a884] via-[#00d9ff] to-[#00a884] animate-pulse"></div>
                          )}

                          {/* Profile Picture Container */}
                          <div className={`relative w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-[#dfe3e5] dark:bg-[#6a7175] shrink-0 ${hasStatus ? 'border-2 border-white dark:border-[#111b21]' : ''}`}>
                            {/* Avatar Image */}
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || conv.number)}&background=random&color=fff&bold=true&size=128`}
                              alt={conv.name || conv.number}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'; // Hide broken image
                                e.target.nextSibling.style.display = 'flex'; // Show fallback
                              }}
                            />
                            {/* Fallback Initials (Hidden by default, shown on error) */}
                            <div className="hidden absolute inset-0 items-center justify-center text-gray-600 dark:text-[#d1d7db] font-bold text-lg">
                              {(conv.name?.[0] || conv.number?.[0] || '#').toUpperCase()}
                            </div>
                          </div>

                          {/* Online Indicator */}
                          {presenceMap[last10(conv.number)]?.online && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-white dark:border-[#111b21] rounded-full z-10"></div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="ml-3 flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-[17px] font-normal truncate text-[#111b21] dark:text-[#e9edef]">{conv.name || conv.number}</h4>
                      <span className="text-[12px] text-[#667781] dark:text-[#8696a0]">{conv.timestamp}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <div className="text-[14px] truncate flex-1 text-[#667781] dark:text-[#8696a0]">
                        {renderPresenceStatus(conv) === <span className="text-xs text-[#667781] dark:text-[#8696a0]">Offline</span> ? conv.lastMessage : renderPresenceStatus(conv)}
                      </div>
                      {conv.unread > 0 && (
                        <div className="bg-[#00a884] text-white dark:text-[#111b21] text-[12px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1 ml-2">
                          {conv.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Left Drawer: New Chat */}
        <Drawer isOpen={leftDrawer === 'newChat'} onClose={() => setLeftDrawer(null)} title="New chat">
          <div className="p-4">
            <input
              type="text"
              placeholder="Search contacts"
              className="w-full px-4 py-2 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#2a3942] focus:outline-none text-[#111b21] dark:text-[#e9edef] mb-4"
            />

            {/* Add New Contact Section */}
            <div className="mb-4 p-3 bg-white dark:bg-[#202c33] rounded shadow-sm border border-gray-200 dark:border-[#2a3942]">
              <h4 className="text-xs font-bold text-[#008069] uppercase mb-3">Add New Contact</h4>
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact Name"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-[#2a3942] border-none rounded mb-2 text-sm text-[#111b21] dark:text-[#e9edef]"
              />
              <input
                type="tel"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                placeholder="Phone number (e.g. +91...)"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-[#2a3942] border-none rounded mb-2 text-sm text-[#111b21] dark:text-[#e9edef]"
              />
              <button
                onClick={async () => {
                  const clean = digitsOnly(newPhoneNumber);
                  if (clean.length >= 10 && newContactName.trim()) {
                    const full = clean.length === 10 ? `+91${clean}` : newPhoneNumber;

                    // Save contact to database
                    try {
                      await axios.post(`${API_BASE_URL}/contacts/add`, {
                        name: newContactName.trim(),
                        phoneNumber: full
                      }, { headers: getAuthHeaders() });

                      // Refresh contacts list
                      const response = await axios.get(`${API_BASE_URL}/contacts`, { headers: getAuthHeaders() });
                      if (response.data && Array.isArray(response.data)) {
                        setContacts(response.data);
                      }

                      // Start chat
                      pickContactAndStartChat({ number: full, name: newContactName.trim() });
                      setLeftDrawer(null);
                      setNewContactName('');
                      setNewPhoneNumber('');
                    } catch (error) {
                      console.error('Failed to save contact:', error);
                      alert('Failed to save contact. Please try again.');
                    }
                  } else {
                    alert('Please enter both name and a valid phone number');
                  }
                }}
                className="w-full bg-[#00a884] text-white py-2 rounded text-sm font-bold hover:bg-[#008f6f] transition"
              >
                Save & Start Chat
              </button>
            </div>

            <h4 className="text-xs font-bold text-[#008069] uppercase mb-4">Contacts on WhatsApp</h4>
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No contacts found</p>
                <p className="text-xs mt-1">Add a new contact above to get started</p>
              </div>
            ) : (
              contacts.map(contact => (
                <div key={contact.id || contact.number} onClick={() => { pickContactAndStartChat(contact); setLeftDrawer(null); }} className="flex items-center p-3 hover:bg-[#e9edef] dark:hover:bg-[#202c33] cursor-pointer border-b border-gray-100 dark:border-[#2a3942]">
                  <div className="w-10 h-10 bg-[#dfe3e5] dark:bg-[#6a7175] rounded-full flex items-center justify-center text-gray-600 dark:text-[#d1d7db] font-bold text-sm mr-4">
                    {(contact.name?.[0] || '#').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[16px] text-[#111b21] dark:text-[#e9edef]">{contact.name}</p>
                    <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">{contact.number}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Drawer>

        {/* Status Drawer */}
        <StatusDrawer
          isOpen={leftDrawer === 'status'}
          onClose={() => setLeftDrawer(null)}
          statusList={statusList}
          onViewStatus={(userStatus) => {
            // Open the status viewer (using the existing modal for now or a new viewer)
            handleViewStatus(userStatus);
            // Optionally close the drawer if you want full screen experience, but WhatsApp keeps drawer open behind
          }}
          onCreateStatus={() => {
            // Open the create status modal
            setShowStatusModal(true);
          }}
        />
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#efeae2] dark:bg-[#0b141a] relative">
          {/* Chat Background Pattern */}
          <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

          {/* Chat Header */}
          <div className="h-[60px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 py-2 shrink-0 z-10 border-b border-gray-200 dark:border-[#2a3942] cursor-pointer" onClick={() => setRightDrawer('contactInfo')}>
            <div className="flex items-center">
              <button onClick={(e) => { e.stopPropagation(); setSelectedConversation(null); }} className="md:hidden mr-3 text-[#54656f] dark:text-[#aebac1]">
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 bg-[#dfe3e5] dark:bg-[#6a7175] rounded-full flex items-center justify-center text-gray-600 dark:text-[#d1d7db] font-bold text-lg">
                {(selectedConversation.name?.[0] || '#').toUpperCase()}
              </div>
              <div className="ml-3">
                <h3 className="text-[16px] font-normal text-[#111b21] dark:text-[#e9edef]">{selectedConversation.name || selectedConversation.number}</h3>
                <p className="text-[13px] text-[#667781] dark:text-[#8696a0]">{renderPresenceStatus(selectedConversation)}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[#54656f] dark:text-[#aebac1]" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleVideoCall} title="Video Call"><VideoCameraIcon className="w-6 h-6" /></button>
              <button onClick={handleVoiceCall} title="Voice Call"><PhoneIcon className="w-6 h-6" /></button>
              <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <button onClick={() => setShowSearchInChat(!showSearchInChat)} title="Search"><MagnifyingGlassIcon className="w-6 h-6" /></button>
              <button title="Menu" onClick={() => setShowChatMenu(!showChatMenu)}><EllipsisVerticalIcon className="w-6 h-6" /></button>
              {showChatMenu && (
                <div className="absolute right-4 top-14 w-48 bg-white dark:bg-[#202c33] rounded-md shadow-lg py-2 z-50 border border-gray-100 dark:border-[#2a3942]">
                  <button onClick={() => { setRightDrawer('contactInfo'); setShowChatMenu(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21]">Contact info</button>
                  <button onClick={() => { clearChatForSelected(); setShowChatMenu(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21]">Clear messages</button>
                  <button onClick={() => { deleteConversation(selectedConversation); setShowChatMenu(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-[#f0f2f5] dark:hover:bg-[#111b21]">Delete chat</button>
                </div>
              )}
            </div>
          </div>

          {/* Search in Chat Bar */}
          {showSearchInChat && (
            <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 border-b border-gray-200 dark:border-[#2a3942] z-10">
              <div className="flex items-center bg-white dark:bg-[#2a3942] rounded-lg px-3 py-1.5">
                <MagnifyingGlassIcon className="w-5 h-5 text-[#54656f] dark:text-[#8696a0] mr-3" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="bg-transparent border-none focus:ring-0 text-sm w-full text-[#111b21] dark:text-[#e9edef] placeholder-[#54656f] dark:placeholder-[#8696a0]"
                  value={searchInChatTerm}
                  onChange={(e) => setSearchInChatTerm(e.target.value)}
                  autoFocus
                />
                <button onClick={() => { setShowSearchInChat(false); setSearchInChatTerm(''); }} className="text-[#54656f] dark:text-[#8696a0]">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 z-10 custom-scrollbar flex flex-col gap-1">
            {groupedMessages.map((item, idx) => {
              if (item.type === 'date') {
                return <DateSeparator key={`date-${idx}`} date={item.date} />;
              }
              const msg = item;
              const isFirst = idx === 0 || groupedMessages[idx - 1].sender !== msg.sender;
              return (
                <div key={msg.id || idx} className={isFirst ? 'mt-2' : ''}>
                  <MessageBubble message={msg} onRightClick={handleRightClick} />
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="min-h-[62px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 flex items-end gap-2 z-20">
            <button className="p-2 text-[#54656f] dark:text-[#8696a0]" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <FaceSmileIcon className="w-7 h-7" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 z-50" ref={emojiPickerRef}>
                <EmojiPicker theme="auto" onEmojiClick={(e) => setNewMessage(prev => prev + e.emoji)} />
              </div>
            )}

            <button className="p-2 text-[#54656f] dark:text-[#8696a0]" onClick={() => fileInputRef.current?.click()}>
              <PlusIcon className="w-7 h-7" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />

            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg flex items-center min-h-[42px] px-4 py-2 my-1">
              {selectedFile && (
                <div className="flex items-center gap-2 mr-2 bg-gray-100 dark:bg-[#202c33] px-2 py-1 rounded">
                  <span className="text-xs text-[#111b21] dark:text-[#e9edef] truncate max-w-[100px]">{selectedFile.name}</span>
                  <XMarkIcon className="w-4 h-4 cursor-pointer text-[#54656f] dark:text-[#8696a0]" onClick={() => setSelectedFile(null)} />
                </div>
              )}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message"
                className="bg-transparent border-none focus:ring-0 w-full text-[15px] text-[#111b21] dark:text-[#e9edef] placeholder-[#54656f] dark:placeholder-[#8696a0] p-0"
              />
            </div>

            {newMessage.trim() || selectedFile ? (
              <button onClick={sendMessage} className="p-2 text-[#54656f] dark:text-[#8696a0]">
                <PaperAirplaneIcon className="w-6 h-6" />
              </button>
            ) : (
              <div className="relative">
                {isRecordingAudio ? (
                  <div className="flex items-center gap-2">
                    <button onClick={cancelAudioRecording} className="p-2 text-red-500">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-600 dark:text-red-400 font-mono">{Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <button onClick={stopAudioRecording} className="p-2 text-[#00a884]">
                      <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <button onMouseDown={startAudioRecording} className="p-2 text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884]">
                    <MicrophoneIcon className="w-6 h-6" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Drawer: Contact Info */}
          <Drawer isOpen={rightDrawer === 'contactInfo'} onClose={() => setRightDrawer(null)} title="Contact info" position="right">
            <ContactInfo contact={selectedConversation} onClose={() => setRightDrawer(null)} />
          </Drawer>

        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#202c33] border-b-8 border-[#00a884]">
          <div className="text-center">
            <h2 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4">WhatsApp Web</h2>
            <p className="text-sm text-[#667781] dark:text-[#8696a0]">Send and receive messages without keeping your phone online.<br />Use WhatsApp on up to 4 linked devices and 1 phone.</p>
          </div>
        </div>
      )}

      {/* Modals (Context Menu, Delete, Profile, New Chat) */}
      {contextMenu && (
        <div className="fixed z-50" style={{ top: contextMenu.y, left: contextMenu.x }} onMouseLeave={closeContextMenu}>
          <div className="bg-white dark:bg-[#202c33] rounded-md shadow-lg py-1 w-48 border border-gray-100 dark:border-[#2a3942]">
            <button
              onClick={() => {
                setMessageToDelete(contextMenu.message);
                setShowDeleteModal(true);
                closeContextMenu();
              }}
              className="block w-full text-left px-4 py-2 text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21]"
            >
              Delete message
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#202c33] p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-[#111b21] dark:text-[#e9edef]">Delete message?</h3>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteForEveryone} className="w-full py-2 rounded bg-[#005c4b] text-white hover:bg-[#00a884]">Delete for everyone</button>
              <button onClick={handleDeleteForMe} className="w-full py-2 rounded border border-gray-200 dark:border-[#2a3942] text-[#00a884] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21]">Delete for me</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-2 rounded border border-gray-200 dark:border-[#2a3942] text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21]">Cancel</button>
            </div>
          </div>
        </div>
      )}


      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white dark:bg-[#202c33] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-[#2a3942]">
              <h3 className="text-xl font-semibold text-[#111b21] dark:text-[#e9edef]">Status Updates</h3>
              <p className="text-sm text-[#667781] dark:text-[#8696a0] mt-1">Share photos, videos and text updates that disappear after 24 hours</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Create Status Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#111b21] dark:text-[#e9edef] mb-3">Create New Status</h4>
                <div className="space-y-3">
                  {/* Status Type Selection */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const statusInput = document.getElementById('statusTextInput');
                        if (statusInput && statusInput.value.trim()) {
                          handleCreateStatus('text', statusInput.value);
                          statusInput.value = '';
                        } else {
                          alert('Please enter status text');
                        }
                      }}
                      className="flex-1 py-3 rounded-lg bg-[#00a884] text-white hover:bg-[#008069] font-medium flex items-center justify-center gap-2"
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      Text Status
                    </button>
                    <button
                      onClick={() => document.getElementById('statusMediaInput').click()}
                      className="flex-1 py-3 rounded-lg border-2 border-[#00a884] text-[#00a884] hover:bg-[#00a884]/10 font-medium flex items-center justify-center gap-2"
                    >
                      <PhotoIcon className="w-5 h-5" />
                      Photo/Video
                    </button>
                  </div>

                  {/* Text Input */}
                  <textarea
                    id="statusTextInput"
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 bg-[#f0f2f5] dark:bg-[#2a3942] border-none rounded-lg focus:ring-2 focus:ring-[#00a884] text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] resize-none"
                    rows="3"
                  ></textarea>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    id="statusMediaInput"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const statusType = file.type.startsWith('video/') ? 'video' : 'image';
                        handleCreateStatus(statusType, '', file);
                      }
                    }}
                  />
                </div>
              </div>

              {/* View Statuses Section - REMOVED (Moved to Drawer) */}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-[#2a3942]">
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full py-3 rounded-lg border border-gray-200 dark:border-[#2a3942] text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Modal */}
      {showCommunityModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowCommunityModal(false)}>
          <div className="bg-white dark:bg-[#202c33] p-6 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4 text-[#111b21] dark:text-[#e9edef]">Communities</h3>
            <p className="text-sm text-[#667781] dark:text-[#8696a0] mb-4">Stay connected with a community — a place for members to connect around a common interest.</p>
            <div className="space-y-3">
              <button className="w-full py-3 rounded-lg bg-[#00a884] text-white hover:bg-[#008069] font-medium">
                Create Community
              </button>
              <button onClick={() => setShowCommunityModal(false)} className="w-full py-3 rounded-lg border border-gray-200 dark:border-[#2a3942] text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Drawer */}
      <Drawer isOpen={leftDrawer === 'menu'} onClose={() => setLeftDrawer(null)} title="Menu">
        <div className="p-4">
          <div className="space-y-1">
            {/* Balance Display */}
            <div className="w-full flex items-center justify-between px-4 py-3 mb-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[#111b21] dark:text-[#e9edef] font-medium">Balance</span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">${Number(twilioBalance || 0).toFixed(2)}</span>
            </div>

            {/* Profile */}
            <button
              onClick={() => {
                setLeftDrawer('profile');
              }}
              className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg text-[#111b21] dark:text-[#e9edef] transition-colors"
            >
              <UserIcon className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
              <span>Profile</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                setLeftDrawer('whatsappSettings');
              }}
              className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg text-[#111b21] dark:text-[#e9edef] transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
              <span>Settings</span>
            </button>

            {/* Starred Messages */}
            <button
              onClick={() => {
                setLeftDrawer('starredMessages');
              }}
              className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg text-[#111b21] dark:text-[#e9edef] transition-colors"
            >
              <svg className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>Starred Messages</span>
            </button>

            {/* Archived Chats */}
            <button
              onClick={() => {
                setLeftDrawer('archivedChats');
              }}
              className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg text-[#111b21] dark:text-[#e9edef] transition-colors"
            >
              <svg className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Archived Chats</span>
            </button>

            {/* Help */}
            <button
              onClick={() => {
                setLeftDrawer(null);
                window.location.href = '/help-support';
              }}
              className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg text-[#111b21] dark:text-[#e9edef] transition-colors"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
              <span>Help</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-[#2a3942] my-2"></div>

            {/* Log out */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out?')) {
                  localStorage.clear();
                  window.location.href = '/login';
                }
              }}
              className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg text-red-500 dark:text-red-400 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </Drawer>

      {/* WhatsApp Drawers */}
      <ProfileDrawer
        isOpen={leftDrawer === 'profile'}
        onClose={() => setLeftDrawer(null)}
        senderNumber={senderNumber}
      />

      <WhatsAppSettingsDrawer
        isOpen={leftDrawer === 'whatsappSettings'}
        onClose={() => setLeftDrawer(null)}
      />

      <StarredMessagesDrawer
        isOpen={leftDrawer === 'starredMessages'}
        onClose={() => setLeftDrawer(null)}
      />

      <ArchivedChatsDrawer
        isOpen={leftDrawer === 'archivedChats'}
        onClose={() => setLeftDrawer(null)}
      />

    </div>
  );
};

export default InboxMessage;
