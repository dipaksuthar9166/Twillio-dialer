import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext'; // Step 1 से Socket Context

const API_BASE_URL = 'http://localhost:3001/api/chat';

const ChatWindow = ({ chat, userId }) => { // userId receive करें
  // Socket.IO कनेक्शन को context से प्राप्त करें
  const socket = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Typing Indicator State
  
  // Auto Scroll के लिए Ref
  const messagesEndRef = useRef(null); 

  // --- Utility Function: Auto Scroll ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Real-time Setup (Joining Room & Listeners) ---
  useEffect(() => {
    if (!chat || !socket || !userId) return;
    
    // 1. Room Join करें
    console.log(`Joining room: ${chat.id}`);
    socket.emit('join_room', chat.id); 

    // --- Fetch Old Messages ---
    const fetchOldMessages = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${chat.id}`);
            const fetchedMessages = await response.json();
            
            // fetchedMessages का format आपके Frontend के अनुरूप होना चाहिए
            setMessages(fetchedMessages.map(msg => ({
                ...msg, 
                senderId: msg.senderId, // MongoDB ObjectId
                content: msg.content,
                timestamp: msg.createdAt, // Backend से मिला timestamp
            })));
            
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };
    fetchOldMessages();

    // 3. Message Receive Listener सेट करें
    const handleReceiveMessage = (data) => {
      // सुनिश्चित करें कि मैसेज current room का हो
      if (data.roomId === chat.id) {
        setMessages((prev) => [...prev, data]);
        // Unread count update करने के लिए API call (Optional)
      }
    };
    socket.on('receive_message', handleReceiveMessage);

    // 4. Typing Indicator Listener
    const handleTypingStatus = (data) => {
        // अगर कोई और यूजर (खुद नहीं) उसी रूम में टाइप कर रहा है
        if (data.roomId === chat.id && data.senderId !== userId) {
            setIsTyping(data.isTyping);
        }
    };
    socket.on('typing_status', handleTypingStatus);

    // Cleanup: Component Unmount होने या chat बदलने पर Listeners हटाएँ
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_status', handleTypingStatus);
    };
  }, [chat, socket, userId]); // Dependencies: chat object, socket, userId

  // --- Auto Scroll Effect ---
  // messages array अपडेट होने पर scroll करें
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]); // Typing indicator दिखने पर भी scroll करें

  // --- Typing Indicator Handler ---
  // जब इनपुट बदलता है तो typing status emit करें
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Backend को सूचित करें कि यूज़र टाइप कर रहा है
    socket.emit('typing', {
        roomId: chat.id, 
        senderId: userId, 
        isTyping: value.length > 0 // अगर कुछ भी लिखा है तो true
    });
  };

  // --- Send Message Handler ---
  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    const messageData = {
      roomId: chat.id,
      senderId: userId, 
      content: input,
      timestamp: new Date().toISOString(),
    };

    // 1. Message को Backend को भेजें (जिससे वह दूसरे यूज़र तक पहुँचेगा)
    socket.emit('send_message', messageData); 
    
    // 2. मैसेज को Frontend UI में तुरंत दिखाएँ (Optimistic Update)
    setMessages((prev) => [...prev, messageData]); 
    
    // 3. इनपुट साफ करें
    setInput('');
    
    // 4. Typing Status को 'false' सेट करें
    socket.emit('typing', {roomId: chat.id, senderId: userId, isTyping: false});
  };
  
  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-lg">
        कृपया बाईं ओर से एक चैट चुनें।
      </div>
    );
  }

  // --- JSX Rendering ---
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg rounded-xl">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50 rounded-t-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{chat.name}</h3>
        {/* Friend's Online Status (InboxList से data यहाँ पास करें) */}
        <p className="text-sm text-gray-600 dark:text-gray-400">Online Status: {chat.online ? 'Online' : 'Offline'}</p>
      </div>
      
      {/* Messages Area */}
      <div className="flex flex-col space-y-2 p-4 overflow-y-auto flex-grow custom-scrollbar">
        {messages.map((msg, index) => {
          const isMyMessage = msg.senderId === userId;
          return (
            <div key={index} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-xl inline-block shadow 
                               ${isMyMessage ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                {msg.content}
                {/* Message Time Display */}
                <span className="block text-right text-xs opacity-75 mt-1 dark:text-gray-300">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && (
            <div className="flex justify-start">
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm italic">
                    {chat.name} is typing...
                </div>
            </div>
        )}
        
        <div ref={messagesEndRef} /> {/* Auto Scroll Target */}
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="flex p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl">
        <div className="flex-grow">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10 px-4"
          />
        </div>
        <div className="ml-4">
          <button 
            type="submit" 
            disabled={input.trim() === ''} // Empty message cannot be sent
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg text-white h-10 px-4 flex-shrink-0 transition duration-150 ease-in-out"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;