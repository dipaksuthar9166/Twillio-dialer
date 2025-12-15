// WhatsAppDrawers.jsx - All WhatsApp-specific drawer components
import React from 'react';
import {
    UserIcon,
    Cog6ToothIcon,
    ChevronRightIcon,
    PencilSquareIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Drawer Component
export const Drawer = ({ isOpen, onClose, title, children, position = 'left' }) => {
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

// Profile Drawer
export const ProfileDrawer = ({ isOpen, onClose, senderNumber }) => (
    <Drawer isOpen={isOpen} onClose={onClose} title="Profile">
        <div className="p-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-[#00a884] to-[#008069] flex items-center justify-center text-white font-bold text-5xl mb-4 cursor-pointer hover:opacity-90 transition-opacity shadow-lg">
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(localStorage.getItem('userName') || 'User')}&background=00a884&color=fff&bold=true&size=256`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className="hidden w-full h-full items-center justify-center">
                        {(localStorage.getItem('userName')?.[0] || 'U').toUpperCase()}
                    </div>
                </div>
                <button className="text-[#00a884] hover:text-[#008069] font-medium transition-colors">
                    Change Photo
                </button>
            </div>

            {/* Name */}
            <div className="mb-6">
                <label className="text-xs text-[#00a884] font-medium mb-1 block">Your name</label>
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#202c33] rounded-lg">
                    <input
                        type="text"
                        defaultValue={localStorage.getItem('userName') || 'User'}
                        className="flex-1 bg-transparent border-none outline-none text-[#111b21] dark:text-[#e9edef]"
                    />
                    <PencilSquareIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </div>
            </div>

            {/* About */}
            <div className="mb-6">
                <label className="text-xs text-[#00a884] font-medium mb-1 block">About</label>
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#202c33] rounded-lg">
                    <input
                        type="text"
                        defaultValue="Hey there! I am using WhatsApp"
                        className="flex-1 bg-transparent border-none outline-none text-[#111b21] dark:text-[#e9edef]"
                    />
                    <PencilSquareIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </div>
            </div>

            {/* Phone */}
            <div>
                <label className="text-xs text-[#00a884] font-medium mb-1 block">Phone</label>
                <div className="px-4 py-3 bg-white dark:bg-[#202c33] rounded-lg">
                    <p className="text-[#111b21] dark:text-[#e9edef]">{senderNumber || '+1 234 567 8900'}</p>
                </div>
            </div>
        </div>
    </Drawer>
);

// WhatsApp Settings Drawer
export const WhatsAppSettingsDrawer = ({ isOpen, onClose }) => (
    <Drawer isOpen={isOpen} onClose={onClose} title="Settings">
        <div className="divide-y divide-gray-200 dark:divide-[#2a3942]">
            {/* Account Settings */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-[#00a884] mb-3">Account</h3>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Privacy</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Last seen, profile photo, about</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Security</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">End-to-end encryption, verification</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
            </div>

            {/* Chat Settings */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-[#00a884] mb-3">Chats</h3>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Theme</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Light, Dark, System default</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Wallpaper</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Change chat background</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Chat Backup</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Backup and restore messages</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
            </div>

            {/* Notifications */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-[#00a884] mb-3">Notifications</h3>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Message notifications</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Sound, vibration, popup</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
            </div>

            {/* Storage */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-[#00a884] mb-3">Storage and data</h3>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Manage storage</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Free up space</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Network usage</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Data usage statistics</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
            </div>

            {/* Help */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-[#00a884] mb-3">Help</h3>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Help Center</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">Contact us</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-[#667781] dark:text-[#8696a0]" />
                </button>
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] rounded-lg transition-colors">
                    <div>
                        <p className="text-[#111b21] dark:text-[#e9edef] font-medium">App info</p>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Version 2.0.0</p>
                    </div>
                </button>
            </div>
        </div>
    </Drawer>
);

// Starred Messages Drawer
export const StarredMessagesDrawer = ({ isOpen, onClose }) => (
    <Drawer isOpen={isOpen} onClose={onClose} title="Starred Messages">
        <div className="p-4">
            <div className="text-center py-12">
                <svg className="w-24 h-24 mx-auto text-[#667781] dark:text-[#8696a0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <h3 className="text-lg font-medium text-[#111b21] dark:text-[#e9edef] mb-2">No starred messages</h3>
                <p className="text-sm text-[#667781] dark:text-[#8696a0]">Tap and hold on any message in any chat, then tap the star icon to find it here later.</p>
            </div>
        </div>
    </Drawer>
);

// Archived Chats Drawer
export const ArchivedChatsDrawer = ({ isOpen, onClose }) => (
    <Drawer isOpen={isOpen} onClose={onClose} title="Archived">
        <div className="p-4">
            <div className="text-center py-12">
                <svg className="w-24 h-24 mx-auto text-[#667781] dark:text-[#8696a0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <h3 className="text-lg font-medium text-[#111b21] dark:text-[#e9edef] mb-2">No archived chats</h3>
                <p className="text-sm text-[#667781] dark:text-[#8696a0]">Swipe left on any chat and tap Archive to hide it from your chat list.</p>
            </div>
        </div>
    </Drawer>
);

// Status Drawer
export const StatusDrawer = ({ isOpen, onClose, statusList = [], myStatus, onViewStatus, onCreateStatus }) => {
    // Separate statuses into recent and viewed (mock logic for now as backend doesn't track viewed state per user yet)
    // In a real app, you'd check if the current user has viewed all statuses in the group.
    const recentUpdates = statusList;
    const viewedUpdates = [];

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="Status">
            <div className="pb-4">
                {/* My Status */}
                <div
                    className="flex items-center gap-3 p-4 bg-white dark:bg-[#111b21] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer transition-colors mb-2 shadow-sm"
                    onClick={onCreateStatus}
                >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(localStorage.getItem('userName') || 'My Status')}&background=00a884&color=fff`}
                                alt="My Status"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] rounded-full border-2 border-white dark:border-[#111b21] flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[#111b21] dark:text-[#e9edef] font-medium">My status</h3>
                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">Click to add status update</p>
                    </div>
                </div>

                {/* Recent Updates */}
                {recentUpdates.length > 0 && (
                    <div className="mb-2">
                        <h3 className="px-4 py-2 text-sm font-medium text-[#008069] dark:text-[#00a884]">Recent updates</h3>
                        <div className="bg-white dark:bg-[#111b21] shadow-sm">
                            {recentUpdates.map(userStatus => (
                                <div
                                    key={userStatus.phoneNumber}
                                    onClick={() => onViewStatus(userStatus)}
                                    className="flex items-center gap-3 p-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer transition-colors border-b border-gray-100 dark:border-[#202c33] last:border-none"
                                >
                                    <div className="p-[2px] rounded-full border-2 border-[#00a884]">
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userStatus.userName || userStatus.phoneNumber)}&background=random&color=fff&bold=true`}
                                                alt={userStatus.userName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[#111b21] dark:text-[#e9edef] font-medium">{userStatus.userName || userStatus.phoneNumber}</h3>
                                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                                            {userStatus.latestStatus ? new Date(userStatus.latestStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Viewed Updates */}
                {viewedUpdates.length > 0 && (
                    <div>
                        <h3 className="px-4 py-2 text-sm font-medium text-[#667781] dark:text-[#8696a0]">Viewed updates</h3>
                        <div className="bg-white dark:bg-[#111b21] shadow-sm">
                            {viewedUpdates.map(userStatus => (
                                <div
                                    key={userStatus.phoneNumber}
                                    onClick={() => onViewStatus(userStatus)}
                                    className="flex items-center gap-3 p-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer transition-colors border-b border-gray-100 dark:border-[#202c33] last:border-none"
                                >
                                    <div className="p-[2px] rounded-full border-2 border-[#d1d7db] dark:border-[#374045]">
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userStatus.userName || userStatus.phoneNumber)}&background=random&color=fff&bold=true`}
                                                alt={userStatus.userName}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[#111b21] dark:text-[#e9edef] font-medium">{userStatus.userName || userStatus.phoneNumber}</h3>
                                        <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                                            {userStatus.latestStatus ? new Date(userStatus.latestStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {recentUpdates.length === 0 && viewedUpdates.length === 0 && (
                    <div className="p-8 text-center text-[#667781] dark:text-[#8696a0]">
                        <p>No recent updates</p>
                    </div>
                )}
            </div>
        </Drawer>
    );
};

