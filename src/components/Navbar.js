import React, { useState, useEffect } from 'react';
import {
    ChevronDownIcon,
    PowerIcon,
    UserIcon,
    ShieldCheckIcon,
    ArrowRightOnRectangleIcon,
    BellIcon,
    SunIcon,
    MoonIcon,
    Bars3Icon
} from "@heroicons/react/24/solid";
import { UserCircleIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { NotificationBell } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const Navbar = ({ userEmail = 'Guest@dialer.app', onLogout, balance = 0.00, onToggle }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentBalance, setCurrentBalance] = useState(balance.toFixed(2));
    const { theme, toggleTheme, isDark } = useTheme();
    const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || null);
    const [isScrolled, setIsScrolled] = useState(false);

    // Scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await axios.get('http://localhost:3001/api/twilio/balance');
                if (res.data && res.data.balance !== undefined) {
                    setCurrentBalance(res.data.balance.toFixed(2));
                }
            } catch (error) {
                console.error("Error fetching balance:", error);
            }
        };
        fetchBalance();
    }, []);

    useEffect(() => {
        const handleProfileImageUpdate = () => {
            setProfileImage(localStorage.getItem('profileImage'));
        };

        window.addEventListener('profileImageUpdated', handleProfileImageUpdate);

        return () => {
            window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
        };
    }, []);

    const rawName = (userEmail || 'Guest').split('@')[0];
    const displayName = rawName
        .split(/[_\.]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    const displayEmail = (userEmail || '').toLowerCase();

    useEffect(() => {
        const handleClickOutside = () => setIsMenuOpen(false);
        if (isMenuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isMenuOpen]);

    const handleSignOut = () => {
        setIsMenuOpen(false);
        onLogout?.();
    };

    const NavMenuItem = ({ to, onClick, icon: Icon, label }) => {
        const Component = to ? Link : 'button';
        const props = to ? { to } : { onClick, type: 'button' };

        return (
            <Component
                {...props}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:text-gray-200 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-200 group"
                onClick={(e) => {
                    if (!to) e.stopPropagation();
                    onClick?.(e);
                }}
            >
                <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">{label}</span>
            </Component>
        );
    };

    const ProfileAvatar = ({ size = "w-10 h-10", textSize = "text-sm" }) => {
        if (profileImage) {
            return (
                <img
                    src={profileImage}
                    alt="Profile"
                    className={`${size} rounded-full object-cover shadow-lg border-2 border-indigo-400 dark:border-indigo-500 ring-2 ring-white/50 dark:ring-gray-800/50`}
                />
            );
        }
        return (
            <div className={`${size} rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center font-bold ${textSize} shadow-lg ring-2 ring-white/50 dark:ring-gray-800/50`}>
                {displayName.charAt(0)}
            </div>
        );
    };

    return (
        <>
            {/* Main Navbar with Glassmorphism */}
            <nav className={`sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b transition-all duration-300 ${isScrolled
                ? 'shadow-lg border-gray-200/50 dark:border-gray-700/50'
                : 'shadow-sm border-gray-100/50 dark:border-gray-800/50'
                }`}>
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Left: Logo & Welcome */}
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={onToggle}
                                className="p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden transition-all duration-200"
                            >
                                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                            </button>

                            {/* Logo/Brand */}
                            {/* 🟢 FIX: Show logo on desktop too for when sidebar is collapsed */}
                            <div className="flex items-center gap-3">
                                <img
                                    src="/logo.png"
                                    alt="Dialer Pro Logo"
                                    className="w-10 h-10 rounded-xl shadow-lg hover:scale-105 transition-transform duration-200"
                                />
                                <div className="hidden sm:block">
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                        Dialer Pro
                                    </h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">Communication Platform</p>
                                </div>
                            </div>

                            {/* Welcome Message */}
                            <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Welcome,</span>
                                <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                    {displayName}
                                </span>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">

                            {/* Balance Card */}
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-all duration-200">
                                <CreditCardIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Balance</span>
                                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                        ${currentBalance}
                                    </span>
                                </div>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-amber-700 dark:text-indigo-300 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 border border-amber-200 dark:border-indigo-700"
                                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDark ? (
                                    <SunIcon className="w-5 h-5 animate-pulse" />
                                ) : (
                                    <MoonIcon className="w-5 h-5" />
                                )}
                                <span className="sr-only">Toggle theme</span>
                            </button>

                            {/* Notification Bell */}
                            <div className="relative">
                                <NotificationBell />
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(!isMenuOpen);
                                    }}
                                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700"
                                >
                                    <ProfileAvatar />
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <div
                                        className="absolute right-0 mt-3 w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* User Info Header */}
                                        <div className="p-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
                                            <div className="flex items-center gap-3">
                                                <ProfileAvatar size="w-14 h-14" textSize="text-xl" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-lg truncate">{displayName}</p>
                                                    <p className="text-sm text-white/80 truncate">{displayEmail}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            <NavMenuItem to="/view-profile" icon={UserCircleIcon} label="View Profile" />
                                            <NavMenuItem to="/login-activity" icon={ShieldCheckIcon} label="Login Activity" />
                                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                                            <NavMenuItem onClick={handleSignOut} icon={ArrowRightOnRectangleIcon} label="Sign Out" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Info Bar */}
            <div className="sm:hidden bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 px-4 py-2.5 border-b border-indigo-100 dark:border-gray-700 flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">Hi, {displayName} 👋</span>
            </div>
        </>
    );
};

export default Navbar;