import React, { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import { UserCircleIcon } from '@heroicons/react/24/outline'; // For the support agent icon

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    const handleSend = (e) => {
        e.preventDefault();
        if (message.trim() === '') return;

        // 💡 REAL-TIME CHAT LOGIC GOES HERE:
        // In a real project, this would send the message to a WebSocket server
        // or a backend API endpoint (e.g., /api/support/send).
        
        console.log("Sending message:", message);
        alert(`Message sent: "${message}". Real-time integration needed.`);
        
        setMessage(''); // Clear input after send
    };

    return (
        // Fixed positioning for the entire chat system
        <div className="fixed bottom-8 right-8 z-[100]"> 
            
            {/* 1. Chat Popup Window (Conditional Rendering) */}
            {isOpen && (
                <div 
                    className="w-80 h-[450px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transform translate-y-0 transition-all duration-300 ease-in-out fade-in slide-up"
                    style={{ 
                        // To match the purple gradient header style from the image
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2), 0 0 0 10px rgba(109, 40, 217, 0.05)' 
                    }}
                >
                    {/* Header with Gradient */}
                    <header className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-purple-500 text-white flex-none">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white rounded-full">
                                <UserCircleIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Open_VBX Support</p>
                                <p className="text-xs text-green-300">Online</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </header>

                    {/* Chat Body (Conversation area) */}
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-gray-700 bg-gray-50">
                        <ChatBubbleBottomCenterTextIcon className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="text-base font-medium">Welcome to live support!</p>
                        <p className="text-sm mt-1">How can we help you today?</p>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 border-t flex items-center bg-white flex-none">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2 focus:ring-purple-500 focus:border-purple-500 text-sm focus:outline-none hover:border-purple-300 focus-glow"
                            disabled={!isOpen}
                        />
                        <button 
                            type="submit" 
                            className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition"
                            disabled={!isOpen}
                        >
                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                        </button>
                    </form>
                </div>
            )}
            
            {/* 2. Floating Toggle Button (Always Visible) */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform duration-300 hover-lift ${
                    isOpen ? 'bg-red-500 rotate-90' : 'bg-purple-600'
                } text-white`}
                style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
                 {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />}
            </button>
        </div>
    );
};

export default ChatWidget;