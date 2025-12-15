import React, { useState } from 'react';
import { Cog6ToothIcon, UserIcon, LockClosedIcon, KeyIcon, CloudIcon } from "@heroicons/react/24/solid";

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar

// Utility function for robust fetching
const fetchApi = async (endpoint, payload) => {
    const userId = localStorage.getItem('userToken');
    
    if (!userId) {
        throw new Error("You must be logged in to change your password.");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}` // Sending Auth Header
        },
        body: JSON.stringify(payload),
    });
    
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `Server returned status ${response.status}.`);
    }
    return data;
};


const Settings = ({ userEmail = 'user@example.com' }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setStatusMessage({ text: '', type: '' });
        
        if (newPassword !== confirmPassword) {
            setStatusMessage({ text: "New passwords do not match.", type: 'error' });
            return;
        }
        if (newPassword.length < 5) {
            setStatusMessage({ text: "Password must be at least 5 characters.", type: 'error' });
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                currentPassword,
                newPassword
            };
            
            // Calling the new backend API endpoint
            const response = await fetchApi('/update-password', payload);

            // Success
            setStatusMessage({ text: response.message || "Password updated successfully!", type: 'success' });
            
            // Clear fields after success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error) {
            // Error handling from API (e.g., Invalid current password)
            setStatusMessage({ text: error.message || `Failed to update password.`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // 🟢 FIX: Added height, overflow, and position compensation for fixed Navbar
        <div 
            className="p-6 bg-gray-50 flex-grow overflow-y-auto"
            style={{ 
                height: '100vh', 
                paddingTop: `${NAVBAR_HEIGHT_PX + 24}px`, // 66px (Navbar) + 24px (p-6)
                marginTop: `-${NAVBAR_HEIGHT_PX}px` // Pull up under the navbar
            }}
        >
            <h2 className="text-3xl font-extrabold flex items-center gap-3 text-gray-800 mb-6 border-b pb-3">
                <Cog6ToothIcon className="w-8 h-8 text-pink-600" /> Account Settings
            </h2>

            {/* Status Message Display */}
            {statusMessage.text && (
                <div className={`p-3 rounded-lg text-sm mb-6 max-w-2xl ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {statusMessage.text}
                </div>
            )}

            {/* Grid for Settings Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Password Management Card */}
                <div className="bg-white shadow-xl rounded-xl p-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-700 mb-4 border-b pb-3">
                        <LockClosedIcon className="w-5 h-5 text-indigo-500" /> Change Password
                    </h3>
                    <p className="text-gray-500 mb-6">Update your account password for enhanced security.</p>
                    
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        
                        {/* Current Password */}
                        <div className="relative">
                            <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* New Password */}
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
                            <input
                                type="password"
                                placeholder="New Password (min 5 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        {/* Confirm New Password */}
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 disabled:bg-gray-400 flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                'Save New Password'
                            )}
                        </button>
                    </form>
                </div>
                
                {/* 2. Account & Twilio Status Card */}
                <div className="bg-white shadow-xl rounded-xl p-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-700 mb-4 border-b pb-3">
                        <UserIcon className="w-5 h-5 text-green-500" /> Account & Service Status
                    </h3>
                    <div className="space-y-4">
                        <p className="text-gray-500">Logged in as:</p>
                        <div className="p-3 bg-gray-100 rounded-lg flex justify-between items-center">
                            <span className="font-medium text-gray-700 truncate">{userEmail}</span>
                            <span className="text-xs font-semibold px-2 py-1 bg-pink-100 text-pink-600 rounded-full">User</span>
                        </div>
                        
                        <div className="pt-4 border-t">
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                                <CloudIcon className="w-5 h-5 text-yellow-500" /> Twilio Status
                            </h4>
                            <p className="text-sm text-gray-500">
                                Twilio configuration is managed on the backend (`server.js` and `.env`).
                            </p>
                            <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
                                    DB Connection: Active
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></span>
                                    Twilio API: Ready (Requires `.env` keys)
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;