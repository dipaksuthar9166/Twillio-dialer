import React, { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

// Node.js server URL
const SOCKET_URL = "http://localhost:3001";

// Socket connection establish करें
const socket = io(SOCKET_URL, {
    autoConnect: false // हम इसे login के बाद manually connect करेंगे
});

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};