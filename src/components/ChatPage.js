import React from 'react';
import InboxList from './InboxList';
import ChatWindow from './ChatWindow';

const ChatPage = () => {
  // Manage selected conversation state here
  const [selectedChat, setSelectedChat] = React.useState(null);

  return (
    <div className="flex h-screen antialiased text-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-gray-200">
      <div className="flex flex-row h-full w-full overflow-x-hidden">
        {/* 1. Inbox List (Left Column) */}
        <div className="flex flex-col w-2/5 md:w-1/3 border-r border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
          <InboxList setSelectedChat={setSelectedChat} selectedChat={selectedChat} />
        </div>

        {/* 2. Chat Window (Right Column) */}
        <div className="flex flex-col flex-auto w-3/5 md:w-2/3 p-6 bg-gray-50 dark:bg-gray-900">
          {selectedChat ? (
            <ChatWindow chat={selectedChat} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChatPage;