import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext'; // सुनिश्चित करें कि यह path सही हो

const InboxList = ({ setSelectedChat, selectedChat, userId }) => { // userId receive करें
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();
    const API_BASE_URL = 'http://localhost:3001/api/chat'; // आपके Node.js routes का Base URL

    // --- 1. Initial Data Fetch ---
    useEffect(() => {
        const fetchConversations = async () => {
            if (!userId) return; // अगर यूज़र ID नहीं है तो Fetch न करें
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/conversations/${userId}`);
                const data = await response.json();
                
                // यहां आपको Backend से मिला हुआ Live Data सेट करना होगा
                // Note: Unread Count और friendId को आपको Backend से सही format में भेजना होगा
                setConversations(data.map(conv => ({
                    id: conv._id,
                    name: conv.participants.find(p => p._id !== userId)?.username || 'Unknown User', // चैट पार्टनर का नाम
                    friendId: conv.participants.find(p => p._id !== userId)?._id, // स्टेटस के लिए friendId
                    lastMessage: conv.lastMessage?.content || 'Start a conversation',
                    time: conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString() : '',
                    unreadCount: 0, // TODO: Backend से Unread Count Fetch करें
                    online: conv.participants.find(p => p._id !== userId)?.isOnline || false,
                })));
            } catch (error) {
                console.error("Error fetching conversations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [userId]); // User ID बदलने पर दोबारा fetch करें

    // --- 1. Chat पर क्लिक करने का Handler ---
    const handleChatClick = (chat) => {
        setSelectedChat(chat);
        
        // Frontend State Update: तुरंत Unread Count को 0 करें
        setConversations(prevConversations => prevConversations.map(c => {
            if (c.id === chat.id) {
                return { ...c, unreadCount: 0 };
            }
            return c;
        }));

        // TODO: Backend को सूचित करने के लिए API call करें कि मैसेज पढ़ लिए गए हैं
        // fetch('/api/messages/mark_read', { method: 'POST', body: JSON.stringify({ conversationId: chat.id }) });
    };


    // --- 2. Real-Time Socket Listeners ---
    useEffect(() => {
        if (!socket) return;
        
        // 2a. Message Receive Listener: Inbox List को Real-Time में अपडेट करें
        const handleReceiveMessage = (data) => {
            setConversations(prevConversations => {
                let chatToMove = null;
                
                const updatedList = prevConversations.map(chat => {
                    if (chat.id === data.roomId) {
                        // Unread Count बढ़ाएँ (अगर chat open नहीं है)
                        const isCurrentlyOpen = selectedChat && selectedChat.id === chat.id;
                        const newUnreadCount = isCurrentlyOpen ? 0 : chat.unreadCount + 1;

                        chatToMove = {
                            ...chat,
                            lastMessage: data.content,
                            time: new Date().toLocaleTimeString(),
                            unreadCount: newUnreadCount,
                        };
                        return chatToMove;
                    }
                    return chat;
                });
                
                // Chat को लिस्ट में सबसे ऊपर ले जाएँ
                if (chatToMove) {
                    const listWithoutMovedChat = updatedList.filter(chat => chat.id !== data.roomId);
                    return [chatToMove, ...listWithoutMovedChat];
                }
                return updatedList;
            });
        };
        socket.on('receive_message', handleReceiveMessage);

        // 2b. User Status Listener: Online/Offline स्टेटस अपडेट करें
        const handleStatusUpdate = (data) => {
            // data format: { userId: 'friend456', status: true/false }
            setConversations(prevConversations => prevConversations.map(chat => {
                // यहाँ friendId का उपयोग करें
                if (chat.friendId === data.userId) { 
                    return { ...chat, online: data.status };
                }
                return chat;
            }));
        };
        socket.on('user_status_update', handleStatusUpdate);


        // Cleanup: Component Unmount होने पर Listeners हटाएँ
        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('user_status_update', handleStatusUpdate);
        };
    }, [socket, selectedChat, userId]);


    // --- JSX Rendering ---
    if (loading) {
        return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading conversations...</div>;
    }
    
    return (
        <>
            {/* Search Bar/Header (Optional) */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Inbox</h2>
            </div>
            
            {/* Conversation List */}
            <div className="flex flex-col space-y-1 mt-2 overflow-y-auto flex-grow">
                {conversations.map(chat => (
                    <button
                        key={chat.id}
                        onClick={() => handleChatClick(chat)}
                        className={`flex flex-row items-center w-full p-3 rounded-xl transition duration-150 ease-in-out text-left
                                    ${selectedChat?.id === chat.id ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'} `}
                    >
                        {/* Avatar and Online Status */}
                        <div className="relative flex items-center justify-center h-12 w-12 bg-indigo-500 rounded-full text-white font-bold text-lg flex-shrink-0">
                            {chat.profilePic}
                            {/* Online/Offline Status Dot */}
                            {chat.online && (
                                <span className="absolute right-0 bottom-0 block h-3 w-3 rounded-full ring-2 ring-white bg-green-500"></span>
                            )}
                        </div>
                        
                        {/* Message Content Area */}
                        <div className="ml-3 flex flex-col items-start w-full min-w-0">
                            {/* Name and Time */}
                            <div className="flex justify-between w-full">
                                <span className="font-semibold truncate text-gray-800 dark:text-gray-100">{chat.name}</span>
                                <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">{chat.time}</div>
                            </div>

                            {/* Last Message and Unread Count */}
                            <div className="flex justify-between items-center w-full mt-0.5">
                                <span className="text-sm truncate text-gray-600 dark:text-gray-400">{chat.lastMessage}</span>
                                
                                {chat.unreadCount > 0 && (
                                    <div className="flex items-center justify-center ml-2 text-xs font-bold text-white bg-green-500 h-5 w-5 rounded-full flex-shrink-0">
                                        {chat.unreadCount}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
                {conversations.length === 0 && (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">No conversations found.</div>
                )}
            </div>
        </>
    );
};

export default InboxList;