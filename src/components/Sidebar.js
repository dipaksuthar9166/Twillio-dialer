import { Link, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { FaWhatsapp } from "react-icons/fa";

import {
    HomeIcon,
    PhoneIcon,
    UsersIcon,
    ArrowRightOnRectangleIcon,
    ChatBubbleLeftRightIcon,
    ChevronDownIcon,
    ClipboardDocumentListIcon,
    BookOpenIcon,
    ChartBarIcon,
    WrenchScrewdriverIcon,
    QuestionMarkCircleIcon,
    MegaphoneIcon,
    ClipboardDocumentListIcon as VoicemailIcon,
    ClockIcon,
    DocumentChartBarIcon,
    ChatBubbleBottomCenterTextIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    UserGroupIcon,
    BoltIcon,
    SparklesIcon
} from "@heroicons/react/24/outline";

// --- CUSTOM STYLES FOR ADVANCED ANIMATIONS ---
const sidebarStyles = `
  @keyframes shine {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
    50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .sidebar-shine-effect {
    background: linear-gradient(
      90deg, 
      rgba(255,255,255,0) 0%, 
      rgba(255,255,255,0.1) 50%, 
      rgba(255,255,255,0) 100%
    );
    background-size: 200% auto;
    animation: shine 3s linear infinite;
  }
  
  .nav-item-enter {
    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0; 
  }

  .glass-morphism {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .dark .glass-morphism {
    background: rgba(15, 23, 42, 0.6);
  }
`;

// Helper component for navigation links (Ultra Animated)
const NavLink = ({ to, icon: Icon, children, className = "", isCollapsed, index = 0 }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to) && to !== "/";
    const isDashboardActive = (location.pathname === "/" || location.pathname === "/dashboard") && (to === "/dashboard" || to === "/");
    const finalIsActive = isActive || isDashboardActive;

    return (
        <Link
            to={to === "/dashboard" ? "/" : to}
            className={`group relative flex items-center rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                ${finalIsActive
                    ? 'text-white shadow-lg shadow-indigo-500/40 scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 hover:shadow-md hover:scale-[1.02]'} 
                ${isCollapsed ? 'justify-center' : 'justify-start'} ${className} nav-item-enter`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Active Background with Gradient & Shine */}
            {finalIsActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x overflow-hidden z-0">
                    <div className="absolute inset-0 sidebar-shine-effect opacity-30"></div>
                </div>
            )}

            {/* Hover Glow Effect (Inactive) */}
            {!finalIsActive && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
            )}

            <div className="relative z-10 flex items-center w-full">
                <Icon className={`w-6 h-6 transition-all duration-500 ease-out flex-shrink-0 
                    ${finalIsActive ? 'text-white rotate-0' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110 group-hover:rotate-6'} 
                    ${isCollapsed ? '' : 'mr-3.5'}`}
                />
                {!isCollapsed && (
                    <span className={`flex-1 truncate tracking-wide transition-all duration-300 ${finalIsActive ? 'font-bold' : 'font-medium'}`}>
                        {children}
                    </span>
                )}

                {/* Floating Orb for Active State */}
                {finalIsActive && !isCollapsed && (
                    <SparklesIcon className="w-4 h-4 text-yellow-300 animate-pulse ml-2" />
                )}
            </div>
        </Link>
    );
};

// Helper component for nested dropdown items
const NestedLink = ({ to, icon: Icon, children, index }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link
            to={to}
            className={`flex items-center pl-10 pr-3 py-2.5 text-sm transition-all duration-300 rounded-xl my-1 relative overflow-hidden group
                ${isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-900/20 shadow-sm translate-x-1'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5 hover:translate-x-1'}`}
            style={{ animationDelay: `${index * 30}ms` }}
        >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full"></div>}

            {Icon && <Icon className={`w-4 h-4 mr-3 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />}
            <span className="truncate relative z-10">{children}</span>
        </Link>
    );
};

const Sidebar = ({ onLogout }) => {
    const { isDark } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const isCollapsed = !isMenuOpen;

    const [isMessageCenterOpen, setIsMessageCenterOpen] = useState(false);
    const [isContactManagerOpen, setIsContactManagerOpen] = useState(false);

    // Inject custom styles
    useEffect(() => {
        const styleId = "sidebar-custom-animations";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = sidebarStyles;
            document.head.appendChild(style);
        }
    }, []);

    // Hide native scrollbars
    useEffect(() => {
        const styleId = "sidebar-scrollbar-style";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = `
                .sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                .sidebar-scroll::-webkit-scrollbar { display: none; }
            `;
            document.head.appendChild(style);
        }
    }, []);

    const toggleDropdown = (setter, isOpen) => {
        if (isCollapsed) {
            setter(false);
            setIsMenuOpen(true);
        } else {
            setter(!isOpen);
        }
    };

    const location = useLocation();

    // Auto-expand dropdowns
    useEffect(() => {
        const path = location.pathname;
        const messageRoutes = ['/all-sms-history', '/campaign-report', '/auto-messages', '/single-sms', '/bulk-messaging', '/message-templates'];
        const contactRoutes = ['/import-contacts', '/contact-groups'];

        if (messageRoutes.some(r => path.startsWith(r))) setIsMessageCenterOpen(true);
        if (contactRoutes.some(r => path.startsWith(r))) setIsContactManagerOpen(true);
    }, [location.pathname]);

    return (
        <div
            className={`flex flex-col h-screen glass-morphism border-r border-white/20 dark:border-white/5 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl z-50 relative overflow-hidden
            ${isCollapsed ? 'w-[90px]' : 'w-[290px]'}`}
        >
            {/* Animated Background Mesh (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-indigo-500/10 blur-[80px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[40%] bg-purple-500/10 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header */}
            <div className={`relative z-10 h-[80px] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} flex-shrink-0`}>
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
                        <img
                            src="/logo.png"
                            alt="Dialer Pro"
                            className="w-10 h-10 relative z-10 transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-110 drop-shadow-lg"
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col animate-slideIn">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Trial Dialer</span>
                            <span className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Control Hub</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className={`relative z-10 flex-1 py-4 space-y-6 overflow-y-auto sidebar-scroll ${isCollapsed ? 'px-3' : 'px-5'}`}>

                {/* Workspace Section */}
                <div className="space-y-1.5">
                    {!isCollapsed && (
                        <div className="px-3 flex items-center gap-2 mb-2 opacity-60">
                            <div className="h-[1px] w-4 bg-gray-400 dark:bg-gray-600"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Workspace</p>
                        </div>
                    )}
                    <NavLink to="/dashboard" icon={HomeIcon} isCollapsed={isCollapsed} index={1}>Dashboard</NavLink>
                    <NavLink to="/inbox" icon={FaWhatsapp} isCollapsed={isCollapsed} index={2}>WhatsApp</NavLink>
                    <NavLink to="/phone-dialer" icon={PhoneIcon} isCollapsed={isCollapsed} index={3}>Phone Dialer</NavLink>
                    <NavLink to="/bulk-calling" icon={MegaphoneIcon} isCollapsed={isCollapsed} index={4}>Bulk Calling</NavLink>
                    <NavLink to="/bulk-call-history" icon={ClockIcon} isCollapsed={isCollapsed} index={5}>Bulk History</NavLink>
                    <NavLink to="/call-history" icon={ChartBarIcon} isCollapsed={isCollapsed} index={6}>Call History</NavLink>
                    <NavLink to="/voicemail-management" icon={VoicemailIcon} isCollapsed={isCollapsed} index={7}>Voicemail</NavLink>
                </div>

                {/* Communication Section */}
                <div className="space-y-1.5">
                    {!isCollapsed && (
                        <div className="px-3 flex items-center gap-2 mb-2 mt-6 opacity-60">
                            <div className="h-[1px] w-4 bg-gray-400 dark:bg-gray-600"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Communication</p>
                        </div>
                    )}

                    {/* Message Center Dropdown */}
                    <div className="space-y-1">
                        <button
                            onClick={() => toggleDropdown(setIsMessageCenterOpen, isMessageCenterOpen)}
                            className={`w-full group flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} rounded-2xl py-3 text-sm font-medium transition-all duration-300
                                ${isMessageCenterOpen
                                    ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                        >
                            <span className="flex items-center gap-3.5">
                                <ChatBubbleLeftRightIcon className={`w-6 h-6 transition-transform duration-300 ${isMessageCenterOpen ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-gray-400 dark:text-gray-500 group-hover:scale-110'}`} />
                                {!isCollapsed && <span>Message Center</span>}
                            </span>
                            {!isCollapsed && (
                                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-500 ${isMessageCenterOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                            )}
                        </button>

                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isMessageCenterOpen && !isCollapsed ? 'max-h-[500px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}`}>
                            <div className="space-y-0.5 pt-2 pb-2 pl-2 border-l-2 border-indigo-100 dark:border-white/10 ml-6">
                                <NestedLink to="/all-sms-history" icon={ClipboardDocumentListIcon} index={1}>All SMS History</NestedLink>
                                <NestedLink to="/campaign-report" icon={DocumentChartBarIcon} index={2}>Campaign Report</NestedLink>
                                <NestedLink to="/auto-messages" icon={ClockIcon} index={3}>Auto Messages</NestedLink>
                                <NestedLink to="/single-sms" icon={ChatBubbleBottomCenterTextIcon} index={4}>Single SMS</NestedLink>
                                <NestedLink to="/bulk-messaging" icon={ChatBubbleLeftRightIcon} index={5}>Bulk Messaging</NestedLink>
                                <NestedLink to="/message-templates" icon={DocumentTextIcon} index={6}>Message Templates</NestedLink>
                            </div>
                        </div>
                    </div>

                    {/* Contact Manager Dropdown */}
                    <div className="space-y-1">
                        <button
                            onClick={() => toggleDropdown(setIsContactManagerOpen, isContactManagerOpen)}
                            className={`w-full group flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} rounded-2xl py-3 text-sm font-medium transition-all duration-300
                                ${isContactManagerOpen
                                    ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                        >
                            <span className="flex items-center gap-3.5">
                                <BookOpenIcon className={`w-6 h-6 transition-transform duration-300 ${isContactManagerOpen ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-gray-400 dark:text-gray-500 group-hover:scale-110'}`} />
                                {!isCollapsed && <span>Contact Manager</span>}
                            </span>
                            {!isCollapsed && (
                                <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-500 ${isContactManagerOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                            )}
                        </button>

                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isContactManagerOpen && !isCollapsed ? 'max-h-[200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}`}>
                            <div className="space-y-0.5 pt-2 pb-2 pl-2 border-l-2 border-indigo-100 dark:border-white/10 ml-6">
                                <NestedLink to="/import-contacts" icon={ArrowDownTrayIcon} index={1}>Import Contacts</NestedLink>
                                <NestedLink to="/contact-groups" icon={UserGroupIcon} index={2}>Contact Groups</NestedLink>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operations Section */}
                <div className="space-y-1.5">
                    {!isCollapsed && (
                        <div className="px-3 flex items-center gap-2 mb-2 mt-6 opacity-60">
                            <div className="h-[1px] w-4 bg-gray-400 dark:bg-gray-600"></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Operations</p>
                        </div>
                    )}
                    <NavLink to="/call-flows-management" icon={ClipboardDocumentListIcon} isCollapsed={isCollapsed} index={8}>Call Flows</NavLink>
                    <NavLink to="/automations" icon={BoltIcon} isCollapsed={isCollapsed} index={9}>Automations</NavLink>
                    <NavLink to="/user-accounts" icon={UsersIcon} isCollapsed={isCollapsed} index={10}>User Accounts</NavLink>
                    <NavLink to="/subscriptions" icon={WrenchScrewdriverIcon} isCollapsed={isCollapsed} index={11}>Subscriptions</NavLink>
                    <NavLink to="/twilio-manager" icon={WrenchScrewdriverIcon} isCollapsed={isCollapsed} index={12}>Twilio Manager</NavLink>
                    <NavLink to="/help-support" icon={QuestionMarkCircleIcon} isCollapsed={isCollapsed} index={13}>Help & Support</NavLink>
                </div>
            </nav>

            {/* Footer / Logout */}
            <div className="relative z-10 p-4 border-t border-white/10 flex-shrink-0 bg-white/30 dark:bg-black/20 backdrop-blur-md">
                <button
                    onClick={onLogout}
                    className={`w-full group flex items-center rounded-2xl px-3 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all duration-300 shadow-sm hover:shadow-red-500/30 ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                    <ArrowRightOnRectangleIcon className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-180" />
                    {!isCollapsed && <span>Log Out</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;