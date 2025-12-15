import React, { useState } from 'react';
import {
    UserIcon,
    AtSymbolIcon,
    PencilSquareIcon,
    CameraIcon,
    CheckIcon,
    DevicePhoneMobileIcon,
    WrenchScrewdriverIcon,
    ArrowPathIcon,
    XMarkIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/solid';

const NAVBAR_HEIGHT_PX = 66;

const Notification = ({ message, type, show, onClose }) => {
    if (!show) return null;

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-emerald-500' : 'bg-red-500';
    const Icon = isSuccess ? CheckIcon : ExclamationCircleIcon;

    return (
        <div className="fixed top-24 right-5 z-50 animate-slide-in-right">
            <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[300px] backdrop-blur-md bg-opacity-90 border border-white/20`}>
                <div className="bg-white/20 p-2 rounded-full">
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm uppercase tracking-wider mb-0.5">{isSuccess ? 'Success' : 'Error'}</h4>
                    <p className="text-sm font-medium text-white/90">{message}</p>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 hover:bg-white/10 rounded-full">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

const ViewProfilePage = () => {
    const [user, setUser] = useState({
        fullName: 'Mr. Dipak Suthar_037',
        email: 'dipaksuthr@gmail.com',
        phone: '',
        role: 'ADMIN',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || null);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showNotification('Please select a valid image file', 'error');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                showNotification('Image size should be less than 2MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setProfileImage(base64String);
                localStorage.setItem('profileImage', base64String);
                window.dispatchEvent(new Event('profileImageUpdated'));

                // Trigger Success Animation
                setShowSuccessAnimation(true);
                setTimeout(() => setShowSuccessAnimation(false), 3000);
                showNotification('Profile picture updated successfully!');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        console.log('Saving changes:', user);

        setTimeout(() => {
            setIsSaving(false);
            showNotification('Profile updated successfully!');
        }, 1500);
    };

    return (
        <div
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            <Notification
                message={notification.message}
                type={notification.type}
                show={notification.show}
                onClose={() => setNotification(prev => ({ ...prev, show: false }))}
            />

            <h1 className="text-2xl font-semibold text-gray-800 mb-1">My Profile</h1>
            <p className="text-gray-500 mb-8 border-b pb-4 text-sm">Manage your personal information and account settings</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                {/* Left Column: Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white shadow-lg rounded-xl p-6 text-center border border-gray-200 h-full">

                        {/* Profile Picture */}
                        <div className="relative inline-block mb-4 group">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover mx-auto shadow-md border-4 border-indigo-50 transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <span className="w-32 h-32 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-5xl mx-auto shadow-md border-4 border-indigo-50">
                                    {user.fullName.charAt(0).toUpperCase()}
                                </span>
                            )}

                            {/* Success Animation Overlay */}
                            <div
                                className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-full transition-all duration-500 ${showSuccessAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
                            >
                                <div className="bg-emerald-500 text-white p-3 rounded-full shadow-xl animate-bounce">
                                    <CheckIcon className="w-8 h-8" />
                                </div>
                            </div>

                            {/* Camera Icon Overlay */}
                            <label
                                htmlFor="profile-image-upload"
                                className="absolute bottom-1 right-1 p-2 bg-white rounded-full border border-gray-200 shadow-lg hover:bg-gray-50 transition-all cursor-pointer hover:scale-110 active:scale-95"
                            >
                                <CameraIcon className="w-5 h-5 text-indigo-600" />
                                <input
                                    id="profile-image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-800">{user.fullName}</h2>
                        <p className="text-gray-600 text-sm mb-4">{user.email}</p>

                        {/* Role Badge */}
                        <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full inline-flex items-center gap-1">
                            <WrenchScrewdriverIcon className="w-3 h-3" /> {user.role}
                        </span>

                    </div>
                </div>

                {/* Right Column: Personal Information Form */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">

                        <div className="flex items-center text-xl font-semibold text-gray-800 mb-6 border-b pb-3">
                            <UserIcon className="w-6 h-6 text-indigo-600 mr-2" /> Personal Information
                            <p className="text-sm font-normal text-gray-500 ml-4">Update your personal details and contact information</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Full Name (Read-Only) */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                                    <UserIcon className='w-4 h-4 text-gray-500' /> Full Name
                                </label>
                                <input
                                    type="text"
                                    value={user.fullName}
                                    readOnly
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-700 cursor-default text-base"
                                />
                            </div>

                            {/* Phone Number (Editable) */}
                            <div className="mb-4">
                                <label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                                    <DevicePhoneMobileIcon className='w-4 h-4 text-gray-500' /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={user.phone}
                                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                    placeholder="Enter your phone number"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                                    disabled={isSaving}
                                />
                            </div>

                            {/* Email Address (Read-Only) */}
                            <div className="mb-4 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                                    <AtSymbolIcon className='w-4 h-4 text-gray-500' /> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={user.email}
                                    readOnly
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-700 cursor-default text-base"
                                />
                            </div>

                        </div>

                        {/* Save Changes Button */}
                        <div className="flex justify-end pt-4 border-t mt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-150 flex items-center gap-2 font-semibold shadow-md"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <ArrowPathIcon className="w-5 h-5 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Floating Chat Button */}
            <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition z-40">
                <PencilSquareIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default ViewProfilePage;