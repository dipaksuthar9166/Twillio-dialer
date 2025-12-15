import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    ChartBarIcon,
    UsersIcon,
    ServerIcon,
    PhoneIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const SuperAdminLayout = ({ children }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-indigo-600">Super Admin</h2>
                </div>
                <nav className="p-4 space-y-2">
                    <Link 
                        to="/superadmin/dashboard" 
                        className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                            isActive('/superadmin/dashboard')
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link 
                        to="/superadmin/users" 
                        className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                            isActive('/superadmin/users')
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <UsersIcon className="w-5 h-5" />
                        Users
                    </Link>
                    <Link 
                        to="/superadmin/system" 
                        className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                            isActive('/superadmin/system')
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <ServerIcon className="w-5 h-5" />
                        System Monitoring
                    </Link>
                    <Link 
                        to="/superadmin/calls" 
                        className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                            isActive('/superadmin/calls')
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <PhoneIcon className="w-5 h-5" />
                        Call Monitoring
                    </Link>
                    <Link 
                        to="/superadmin/messages" 
                        className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                            isActive('/superadmin/messages')
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        Message Logs
                    </Link>
                    <div className="pt-4 mt-4 border-t">
                        <button
                            onClick={() => {
                                localStorage.removeItem('userToken');
                                localStorage.removeItem('userId');
                                window.location.href = '/login';
                            }}
                            className="flex items-center gap-2 p-3 rounded-lg transition-all w-full text-left text-red-600 hover:bg-red-50"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
};

export default SuperAdminLayout;