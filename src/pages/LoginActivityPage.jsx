import React from 'react';
import { 
    ShieldCheckIcon, // For Login Sessions heading
    InformationCircleIcon, // For "No login activity found" icon
    ChatBubbleBottomCenterTextIcon // Floating chat button
} from '@heroicons/react/24/outline'; // Outline icons for a lighter feel

const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar

const LoginActivityPage = () => {
    // --- Dummy Login Session Data ---
    // यदि आप देखना चाहते हैं कि डेटा के साथ टेबल कैसी दिखती है, तो इस सरणी को अनकमेंट करें
    /*
    const loginSessions = [
        {
            id: 1,
            device: 'Chrome on Windows (Current)',
            ipAddress: '192.168.1.1',
            location: 'New York, USA',
            dateTime: '2025-10-26 10:30 AM',
            duration: 'Active',
            status: 'Active',
        },
        {
            id: 2,
            device: 'Safari on iPhone',
            ipAddress: '172.16.0.5',
            location: 'London, UK',
            dateTime: '2025-10-25 08:00 PM',
            duration: '45m',
            status: 'Ended',
        },
        {
            id: 3,
            device: 'Firefox on Linux',
            ipAddress: '10.0.0.10',
            location: 'Berlin, Germany',
            dateTime: '2025-10-25 09:00 AM',
            duration: '1h 00m',
            status: 'Ended',
        },
    ];
    */

    // वर्तमान में खाली डेटा के लिए
    const loginSessions = []; 

    const totalSessions = loginSessions.length;

    return (
        // 🟢 FIX: Added height, overflow, and position compensation for fixed Navbar
        <div 
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{ 
                height: '100vh', 
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, // 66px (Navbar) + 32px (p-8)
                marginTop: `-${NAVBAR_HEIGHT_PX}px` // Pull up under the navbar
            }}
        >
            <h1 className="text-2xl font-semibold text-gray-800 mb-1">Login Activity</h1>
            <p className="text-gray-500 mb-8 border-b pb-4 text-sm">Monitor your account login sessions and security</p>

            <div className="max-w-6xl mx-auto">
                {/* --- Login Sessions Card --- */}
                <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                    
                    {/* Header for Login Sessions Card */}
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div className="flex items-center text-xl font-semibold text-gray-800">
                            <ShieldCheckIcon className="w-6 h-6 text-indigo-600 mr-2" /> Login Sessions
                            <p className="text-sm font-normal text-gray-500 ml-4 hidden sm:block">All your login sessions with device and location information</p>
                        </div>
                        <span className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-full shadow-md">
                            Total: {totalSessions} sessions
                        </span>
                    </div>

                    {/* Table or No Activity Message */}
                    {totalSessions > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Device & Browser
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IP Address
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Session Duration
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loginSessions.map((session) => (
                                        <tr key={session.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.device}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{session.ipAddress}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{session.location}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{session.dateTime}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{session.duration}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    session.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // No login activity found message (Matches image)
                        <div className="text-center py-12 text-gray-500">
                            <InformationCircleIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-lg font-medium">No login activity found</p>
                            <p className="text-sm mt-1">Your recent login sessions will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Floating Chat Button */}
            <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition z-40">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default LoginActivityPage;