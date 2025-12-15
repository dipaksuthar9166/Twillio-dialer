import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { io } from "socket.io-client";

// Component Imports
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Dialer from "./pages/PhoneDialer";
import RealTimeDialer from "./pages/RealTimeDialer";
import CallLog from "./pages/CallHistory";
import Settings from './pages/Settings';
import UserAccounts from './pages/UserAccounts';
import SMSPage from './pages/SMSpage';
import SMSLogs from './pages/SMSLogs';


import ChatWidget from "./components/ChatWidget";

// Advanced App component with routing and authentication
import InboxMessagePage from './pages/InboxMessagePage';
import CallLogPage from './pages/CallLogPage';
import CallHistory from './pages/CallHistory';
import AutoMessagesPage from './pages/AutoMessagesPage';
import ImportContactsPage from './pages/ImportContactsPage';

import BulkSMSCampaignPage from './pages/Bulk-Messaging';
import BulkCallerPage from './pages/BulkCallerPage';
import CampaignReportPage from './pages/CampaignReportPage';
import ContactGroupsPage from './pages/ContactGroupsPage';
import HelpAndSupportPage from './pages/Help-Support';
import SMSTemplateManagementPage from './pages/MessageTemplates';
import SubscriptionPage from './pages/Subscriptions';
import ViewProfilePage from './pages/ViewProfilePage';
import LoginActivityPage from './pages/LoginActivityPage';
import SpreadsheetDetailsPage from './pages/SpreadsheetDetailsPage';
import CallFlowsPage from './pages/CallFlowsPage';

import VoicemailManagementPage from './pages/VoicemailManagementPage.jsx';
import SingleMessage from './pages/SingleMessage';
import TwilioManagerPage from './pages/TwilioManagerPage';
import VideoRoomPage from './pages/VideoRoomPage';
import BulkCallHistoryPage from './pages/BulkCallHistoryPage';
import AutomationsPage from './pages/AutomationsPage';
import AllSMSHistory from './pages/AllSMSHistory';
import LandingPage from './pages/LandingPage';
import { SocketProvider, useSocket } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';





// Backend API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AppContent = () => {
    // ✅ IMPROVEMENT: Local storage se initial state ko read karne ke liye function use karein
    const socket = useSocket();

    const getInitialState = (key, defaultValue) => {
        return localStorage.getItem(key) || defaultValue;
    };
    const handleLoginSuccess = async (email, userId, role = 'user') => {
        try {
            // Verify the user ID with backend (fallback to local success if API unavailable)
            const res = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login verification failed');
            // If verification succeeds, store credentials
            localStorage.setItem('userToken', userId);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', role);
            setIsLoggedIn(true);
            setUserEmail(email);
            setUserRole(role);
            if (socket) {
                socket.connect();
                socket.emit('user_connected', userId);
            }
        } catch (err) {
            // Fallback: still log in locally if backend unavailable
            console.warn('Auth verification failed, proceeding with local login:', err.message);
            localStorage.setItem('userToken', userId);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', role);
            setIsLoggedIn(true);
            setUserEmail(email);
            setUserRole(role);
            if (socket) {
                socket.connect();
                socket.emit('user_connected', userId);
            }
        }
    };

    const handleLogout = () => {
        // Socket connection ko disconnect karein
        if (socket) {
            socket.disconnect();
        }

        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        setIsLoggedIn(false);
        setUserEmail('Guest');
        setUserRole('user');
    };

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userToken'));
    const [userEmail, setUserEmail] = useState(getInitialState('userEmail', 'Guest'));
    const [userRole, setUserRole] = useState(getInitialState('userRole', 'user'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // 🚩 NEW: Sidebar toggle handler
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };


    // Handle initial state on resize (desktop view should always show sidebar)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(true);
            } else {
                // Keep sidebar closed by default on mobile unless opened manually
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🟢 FIX: Prevent background scroll when sidebar is open on mobile
    useEffect(() => {
        if (isSidebarOpen && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isSidebarOpen]);


    // --- UNAUTHENTICATED ROUTES ---
    return (
        <Router>
            {!isLoggedIn ? (
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                    {/* � FIX: Redirect any other path to /login if not logged in */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            ) : (
                <div className="flex h-screen overflow-hidden relative bg-gray-50/50 dark:bg-slate-900/50">
                    {/* --- GLOBAL ANIMATED BACKGROUND --- */}
                    <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </div>

                    {/* --- AUTHENTICATED ROUTES --- */}
                    {/* 🚩 Sidebar Rendering Container */}
                    <div
                        className={`transform transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                            } md:translate-x-0 fixed md:static h-full flex-shrink-0`}
                    >
                        <Sidebar onLogout={handleLogout} onToggle={toggleSidebar} />
                    </div>

                    {/* 🚩 Mobile Sidebar Overlay (Only visible when sidebar is open on small screens) */}
                    {isSidebarOpen && window.innerWidth < 768 && (
                        <div
                            onClick={toggleSidebar}
                            className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
                        ></div>
                    )}


                    {/* Main Content Area (No scroll - pages handle their own layout) */}
                    <div className="flex-1 flex flex-col h-full overflow-hidden relative backdrop-blur-[2px]">
                        <Navbar userEmail={userEmail} onLogout={handleLogout} onToggle={toggleSidebar} />

                        <main className="flex-1 overflow-hidden relative">
                            {/* Global Page Entrance Animation Wrapper */}
                            <div className="h-full w-full animate-fade-in-up">
                                <Routes>
                                    {/* Redirect login pages if already authenticated */}
                                    <Route path="/login" element={<Navigate to="/" replace />} />

                                    {/* Root route for normal users */}
                                    <Route path="/" element={<Dashboard socket={socket} />} />
                                    <Route path="/realtime-dialer" element={<RealTimeDialer />} />
                                    <Route path="/dialer" element={<Navigate to="/realtime-dialer" replace />} />
                                    <Route path="/call-log" element={<CallLog />} />
                                    <Route path="/settings" element={<Settings userEmail={userEmail} />} />
                                    <Route path="/user-accounts" element={<UserAccounts />} />
                                    <Route path="/sms" element={<SMSPage socket={socket} />} /> {/* 💡 socket prop added */}
                                    <Route path="/sms-logs" element={<SMSLogs />} />
                                    <Route path="/inbox" element={<InboxMessagePage socket={socket} />} /> {/* 💡 socket prop added */}
                                    <Route path="/call-log-page" element={<CallLogPage />} />
                                    <Route path="/auto-messages" element={<AutoMessagesPage />} />
                                    <Route path="/import-contacts" element={<ImportContactsPage />} />
                                    <Route path="/bulk-messaging" element={<BulkSMSCampaignPage />} />
                                    <Route path="/bulk-calling" element={<BulkCallerPage />} />
                                    <Route path="/campaign-report" element={<CampaignReportPage />} />
                                    <Route path="/contact-groups" element={<ContactGroupsPage />} />
                                    <Route path="/help-support" element={<HelpAndSupportPage />} />
                                    <Route path="/message-templates" element={<SMSTemplateManagementPage />} />
                                    <Route path="/subscription" element={<SubscriptionPage />} />
                                    <Route path="/call-history" element={<CallHistory />} />
                                    <Route path="/inbox-message" element={<InboxMessagePage socket={socket} />} /> {/* 💡 socket prop added */}
                                    <Route path='/phone-dialer' element={<Dialer />} />
                                    <Route path="/subscriptions" element={<SubscriptionPage />} />
                                    <Route path="/view-profile" element={<ViewProfilePage />} />
                                    <Route path='/login-activity' element={<LoginActivityPage />} />
                                    <Route path='/spreadsheet-details' element={<SpreadsheetDetailsPage />} />
                                    <Route path='/call-flows-management' element={<CallFlowsPage />} />
                                    <Route path='/voicemail-management' element={<VoicemailManagementPage />} />
                                    <Route path='/single-sms' element={<SingleMessage />} />
                                    <Route path='/single-sms' element={<SingleMessage />} />
                                    <Route path='/twilio-manager' element={<TwilioManagerPage />} />
                                    <Route path="/bulk-call-history" element={<BulkCallHistoryPage />} />
                                    <Route path="/automations" element={<AutomationsPage />} />
                                    <Route path="/all-sms-history" element={<AllSMSHistory />} />
                                    <Route path="/video-room/:roomName" element={<VideoRoomPage />} /> {/* 🟢 ADD: Video Room Route */}
                                    {/* Fallback for authenticated users if they hit an unknown page */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </div>
                        </main>
                    </div>
                    {/* 💡 ChatWidget ko socket prop pass kiya */}
                    <ChatWidget socket={socket} />
                </div>
            )
            }
        </Router >
    );
}

function App() {
    //... login logic के बाद socket.connect() कॉल करें
    return (
        // 🟢 FIX: Wrap providers at the top level
        <ThemeProvider>
            <NotificationProvider>
                <SocketProvider>
                    <AppContent />
                </SocketProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}

export default App;