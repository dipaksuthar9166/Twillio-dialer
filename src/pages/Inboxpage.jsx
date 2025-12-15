// src/pages/InboxPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './InboxPage.css';

const socket = io('http://localhost:5000'); // Backend URL

const InboxPage = () => {
  const [username, setUsername] = useState('');
  const [registered, setRegistered] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUser, setTypingUser] = useState(null);
  const [lastMessages, setLastMessages] = useState({}); // For inbox preview
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Register User
  const register = async () => {
    if (!username.trim()) return alert('Username required');
    const res = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (res.ok) {
      setRegistered(true);
      localStorage.setItem('username', username);
    } else {
      alert('Username already taken!');
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('username');
    if (saved) {
      setUsername(saved);
      setRegistered(true);
    }
  }, []);

  // Join Socket & Fetch Users
  useEffect(() => {
    if (registered) {
      socket.emit('join', username);
      fetchUsers();
    }
  }, [registered]);

  // Fetch All Users
  const fetchUsers = async () => {
    const res = await fetch('http://localhost:5000/users');
    const data = await res.json();
    const filtered = data.filter(u => u.username !== username);
    setUsers(filtered);

    // Initialize online status
    const statusObj = {};
    filtered.forEach(u => {
      statusObj[u.username] = u.online;
    });
    setOnlineStatuses(statusObj);
  };

  // Socket Listeners
  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      if (msg.from === selectedUser || msg.to === selectedUser) {
        setMessages(prev => [...prev, msg]);
        markAsRead(msg.from);
      } else {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.from]: (prev[msg.from] || 0) + 1
        }));
      }

      // Update last message preview
      const chatKey = [msg.from, msg.to].sort().join('-');
      setLastMessages(prev => ({
        ...prev,
        [chatKey]: { text: msg.text, time: msg.timestamp, from: msg.from }
      }));
    });

    socket.on('onlineStatus', ({ username: user, online }) => {
      setOnlineStatuses(prev => ({ ...prev, [user]: online }));
    });

    socket.on('typing', (from) => {
      if (from === selectedUser) setTypingUser(from);
    });

    socket.on('stopTyping', () => setTypingUser(null));

    return () => {
      socket.off('receiveMessage');
      socket.off('onlineStatus');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, [selectedUser, username]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open Chat
  const openChat = async (user) => {
    setSelectedUser(user.username);
    const res = await fetch(`http://localhost:5000/messages/${username}/${user.username}`);
    const data = await res.json();
    setMessages(data);
    markAsRead(user.username);
    setUnreadCounts(prev => ({ ...prev, [user.username]: 0 }));
  };

  const markAsRead = async (from) => {
    await fetch(`http://localhost:5000/messages/read/${from}/${username}`, { method: 'PUT' });
  };

  // Send Message
  const sendMessage = () => {
    if (!text.trim() || !selectedUser) return;
    const msg = { from: username, to: selectedUser, text, timestamp: new Date() };
    socket.emit('sendMessage', msg);
    setMessages(prev => [...prev, msg]);
    setText('');
  };

  // Typing Indicator
  const handleTyping = (e) => {
    setText(e.target.value);
    clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { to: selectedUser, from: username });
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { to: selectedUser });
    }, 1500);
  };

  // Format Time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString();
  };

  // Get Last Message for Inbox
  const getLastMessage = (user) => {
    const chatKey = [username, user.username].sort().join('-');
    return lastMessages[chatKey];
  };

  if (!registered) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>Join Chat</h2>
          <input
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && register()}
          />
          <button onClick={register}>Start Chatting</button>
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-page">
      {/* Inbox List */}
      <div className="inbox-list">
        <div className="inbox-header">
          <h2>Chats</h2>
          <span className="username">Hello, {username}</span>
        </div>
        {users.map(user => {
          const lastMsg = getLastMessage(user);
          return (
            <div
              key={user.username}
              className={`inbox-item ${selectedUser === user.username ? 'active' : ''}`}
              onClick={() => openChat(user)}
            >
              <div className="avatar">{user.username[0].toUpperCase()}</div>
              <div className="user-info">
                <div className="name-status">
                  <strong>{user.username}</strong>
                  <span className={`status-dot ${onlineStatuses[user.username] ? 'online' : 'offline'}`}></span>
                </div>
                <div className="last-msg">
                  {lastMsg ? (
                    <>
                      <span>{lastMsg.from === username ? 'You: ' : ''}{lastMsg.text.slice(0, 25)}{lastMsg.text.length > 25 ? '...' : ''}</span>
                      <span className="time">· {formatTime(lastMsg.time)}</span>
                    </>
                  ) : (
                    <span>No messages yet</span>
                  )}
                </div>
              </div>
              {unreadCounts[user.username] > 0 && (
                <div className="unread-badge">{unreadCounts[user.username]}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user">
                <strong>{selectedUser}</strong>
                <span className={`status-dot ${onlineStatuses[selectedUser] ? 'online' : 'offline'}`}></span>
                <small>{onlineStatuses[selectedUser] ? 'Online' : 'Offline'}</small>
              </div>
            </div>
            <div className="messages-container">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message ${msg.from === username ? 'sent' : 'received'}`}
                >
                  <p>{msg.text}</p>
                  <span className="msg-time">{formatTime(msg.timestamp)}</span>
                </div>
              ))}
              {typingUser && <div className="typing">typing...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <input
                value={text}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-chat">Select a chat to start messaging</div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;