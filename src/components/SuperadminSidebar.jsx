import React from 'react';
// Note: We use 'a' tags here for simplicity, assuming the parent (App.js) handles full page refresh.
// For true SPA navigation, these should be replaced with Link component.
import { Link, useLocation } from 'react-router-dom'; 
import { 
    ShieldCheckIcon, PresentationChartBarIcon, UsersIcon, ClockIcon, 
    WrenchScrewdriverIcon, UserGroupIcon, GiftIcon, LifebuoyIcon, 
    Bars3Icon, GlobeAltIcon, ArrowRightIcon, ChevronLeftIcon // ChevronLeftIcon for hiding the sidebar
} from '@heroicons/react/24/outline'; 

// --- DUMMY DATA ---
const superadminNavItems = [
    { name: 'Management Hub', icon: ShieldCheckIcon, link: '/', section: 'AdminConsole' },
    { name: 'Global Dashboard', icon: PresentationChartBarIcon, link: '/super-dashboard', section: 'Dashboard' },
    { name: 'User Accounts', icon: UsersIcon, link: '/user-accounts', section: 'UserAccounts' },
    { name: 'Call History', icon: ClockIcon, link: '/call-history', section: 'CallHistory' },
    { name: 'Message Templates', icon: WrenchScrewdriverIcon, link: '/message-templates', section: 'MessageTemplates' },
    { name: 'Contact Groups', icon: UserGroupIcon, link: '/contact-groups', section: 'ContactGroups' },
    { name: 'Subscriptions', icon: GiftIcon, link: '/subscription', section: 'Subscriptions' },
    { name: 'Help & Support', icon: LifebuoyIcon, link: '/help-support', section: 'HelpSupport' },
    { name: 'System Logs', icon: GlobeAltIcon, link: '/system-logs', section: 'SystemLogs' },
];


// onToggle prop added to handle sidebar collapse/expand from the parent (App.js)
const SuperadminSidebar = ({ onLogout, onToggle }) => {
    const location = useLocation();
    const activeLink = location.pathname;

    return (
        // Added absolute positioning and z-index for mobile overlap
        <div className="w-64 bg-gray-900 text-white flex-shrink-0 h-screen overflow-y-auto flex flex-col justify-between z-40 relative">
            <div>
                {/* Logo Section & Close Button */}
                <div className="flex items-center h-16 border-b border-gray-800 p-4">
                     {/* 🚩 MENU BUTTON (Close Sidebar) */}
                     <button 
                         onClick={onToggle} // onToggle prop ko call karega
                         className="p-1 mr-2 text-gray-400 hover:text-white transition duration-150 rounded-full hover:bg-gray-700 md:hidden"
                         title="Close Menu"
                     >
                         <ChevronLeftIcon className="w-6 h-6" /> 
                     </button>
                     <Link to="/" className="text-lg font-bold text-purple-400 flex items-center">
                         <ShieldCheckIcon className='w-6 h-6 mr-2' />
                         OpenVBX SA
                     </Link>
                </div>
                
                {/* Navigation Menu */}
                <nav className="p-2">
                    <div className="text-gray-400 p-3 mt-4 mb-2 font-bold flex items-center">
                        <Bars3Icon className='w-5 h-5 mr-2' />
                        SUPERADMIN MENU
                    </div>
                    {superadminNavItems.map((item) => (
                        <Link 
                            key={item.name} 
                            to={item.link} 
                            className={`flex items-center p-3 my-1 rounded-lg transition-colors ${activeLink === item.link ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800'}`}
                        >
                            <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>
            
            {/* Logout Button */}
            <div className="p-4 border-t border-gray-800">
                <button 
                    onClick={onLogout} 
                    className="w-full text-left p-3 text-red-400 hover:bg-red-800/20 rounded-lg transition font-medium flex items-center justify-center"
                >
                    <ArrowRightIcon className="w-5 h-5 mr-2 rotate-180" />
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default SuperadminSidebar;
