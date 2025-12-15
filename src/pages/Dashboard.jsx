import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import StatsCard from "../components/StatsCard";
import Chart from "../components/Chart";
import {
    PhoneIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    UsersIcon,
    ExclamationCircleIcon,
    BellIcon,
    SparklesIcon,
    BoltIcon
} from "@heroicons/react/24/solid";

const TIME_RANGES = {
    WEEKLY: 'weekly',
};
const API_BASE_URL = 'http://localhost:3001/api';
const MAX_RETRIES = 3;
const DELAY_MS = 500;
const DUMMY_USER_TOKEN = '1';
const LOADER_DURATION_MS = 500;
const NAVBAR_HEIGHT_PX = 66;

// Socket.IO
const socket = io('http://localhost:3001', {
    transports: ['websocket'],
    reconnectionAttempts: 5
});

if (!localStorage.getItem("userId")) {
    localStorage.setItem("userId", DUMMY_USER_TOKEN);
}

const MOCK_CHART_DATA = [
    { label: 'Day 1', count: 10, completed_count: 7, missed_count: 3, unique_count: 8 },
    { label: 'Day 2', count: 15, completed_count: 10, missed_count: 5, unique_count: 12 },
    { label: 'Day 3', count: 22, completed_count: 15, missed_count: 7, unique_count: 18 },
    { label: 'Day 4', count: 18, completed_count: 12, missed_count: 6, unique_count: 15 },
    { label: 'Day 5', count: 30, completed_count: 20, missed_count: 10, unique_count: 25 },
    { label: 'Day 6', count: 25, completed_count: 18, missed_count: 7, unique_count: 20 },
    { label: 'Day 7', count: 35, completed_count: 28, missed_count: 7, unique_count: 30 },
];

// --- CUSTOM DASHBOARD STYLES ---
const dashboardStyles = `
  @keyframes float-slow {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(10px, -10px); }
  }
  @keyframes pulse-soft {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.8; }
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  }
  .dark .glass-card {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .animate-enter {
    animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    transform: translateY(20px);
  }
  @keyframes slideInUp {
    to { opacity: 1; transform: translateY(0); }
  }
`;

const fetchWithAuth = async (url, options = {}, retries = MAX_RETRIES) => {
    const userId = localStorage.getItem("userId");
    if (!userId) throw new Error("User not logged in.");

    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userId}`,
    };

    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { ...options, headers });
            if (res.status === 403) throw new Error("Auth failed.");
            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
                throw new Error(err.message || `HTTP ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, DELAY_MS * (2 ** i)));
        }
    }
};

const Dashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalCalls: 0,
        successRate: "0%",
        avgDuration: "0:00",
        peakHours: 0,
        totalMessages: 0,
        totalUsers: 0,
        totalChange: "N/A",
        completedChange: "N/A",
        missedChange: "N/A",
        fromNumberChange: "N/A",
        callVolume: [],
        hourlyMessageActivity: []
    });

    const [isLoadingData, setIsLoadingData] = useState(false);
    const [showInitialLoader, setShowInitialLoader] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState(TIME_RANGES.WEEKLY);

    // Incoming Call Alerts
    const [incomingCallCount, setIncomingCallCount] = useState(0);
    const [recentIncomingCalls, setRecentIncomingCalls] = useState([]);
    const [showTooltip, setShowTooltip] = useState(false);
    // Incoming Message Alerts
    const [incomingMessageCount, setIncomingMessageCount] = useState(0);
    const [recentIncomingMessages, setRecentIncomingMessages] = useState([]);

    // Inject styles
    useEffect(() => {
        const styleId = "dashboard-custom-styles";
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = dashboardStyles;
            document.head.appendChild(style);
        }
    }, []);

    // Play Notification Sound
    const playNotificationSound = () => {
        const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => { });
    };

    const fetchDashboardStats = async () => {
        setError(null);
        if (!showInitialLoader) setIsLoadingData(true);

        try {
            const data = await fetchWithAuth(`${API_BASE_URL}/dashboard-stats?range=${timeRange}`);
            const finalCallVolume = data.callVolume?.length ? data.callVolume : MOCK_CHART_DATA;

            // 🟢 MOCK DATA: If no hourly data, use mock data for demonstration
            const mockHourlyData = [];
            for (let i = 0; i < 24; i++) {
                const hour = (new Date().getHours() - 23 + i + 24) % 24;
                mockHourlyData.push({
                    hour: `${hour.toString().padStart(2, '0')}:00`,
                    single: Math.floor(Math.random() * 6),
                    bulk: Math.floor(Math.random() * 5),
                    inbox: Math.floor(Math.random() * 3)
                });
            }

            const finalHourlyActivity = (data.hourlyMessageActivity && data.hourlyMessageActivity.length > 0)
                ? data.hourlyMessageActivity
                : mockHourlyData;

            setStats({
                totalCalls: parseInt(data.totalCalls) || 0,
                peakHours: parseInt(data.peakHours) || 0,
                totalMessages: parseInt(data.totalMessages) || 0,
                totalUsers: parseInt(data.totalUsers) || 0,
                completed: parseInt(data.completed) || 0,
                missed: parseInt(data.missed) || 0,
                successRate: data.successRate || "0%",
                avgDuration: data.avgDuration || "0:00",
                totalChange: data.totalChange || "0",
                completedChange: data.completedChange || "0",
                missedChange: data.missedChange || "0",
                fromNumberChange: data.fromNumberChange || "0",
                callVolume: finalCallVolume,
                hourlyMessageActivity: finalHourlyActivity
            });
        } catch (error) {
            setError(`Data load failed: ${error.message.substring(0, 50)}...`);
            setStats(prev => ({
                ...prev,
                totalCalls: "N/A", successRate: "N/A", avgDuration: "N/A",
                peakHours: "N/A", totalMessages: "N/A", totalUsers: "N/A",
                callVolume: MOCK_CHART_DATA,
                hourlyMessageActivity: []
            }));
        } finally {
            setIsLoadingData(false);
        }
    };

    // Socket.IO Listeners
    useEffect(() => {
        socket.on('connect', () => console.log('Socket connected'));
        socket.on('disconnect', () => console.log('Socket disconnected'));

        // Incoming Call Alert
        socket.on('incoming_call_alert', (call) => {
            console.log('Incoming call:', call.from);
            setIncomingCallCount(prev => prev + 1);
            setRecentIncomingCalls(prev => [{
                id: call.sid,
                from: call.from,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }, ...prev.slice(0, 4)]);

            playNotificationSound();
            setShowTooltip(true);
        });

        // Incoming Message Alert (SMS)
        socket.on('new_message', (msg) => {
            console.log('Socket: New message event received, refreshing stats.', msg);
            fetchDashboardStats();

            if (msg && (msg.direction === 'inbound' || msg.status === 'received')) {
                setIncomingMessageCount(prev => prev + 1);
                const from = msg.sender || msg.from || msg.from_number || 'Unknown';
                const text = msg.message || msg.body || '';
                setRecentIncomingMessages(prev => [{
                    id: msg.sid || Date.now(),
                    from, text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }, ...prev].slice(0, 5));
                playNotificationSound();
                setShowTooltip(true);
            }
        });

        // Call Status Update → Refresh Stats
        socket.on('call_status_update', () => {
            console.log('Call status updated → refreshing dashboard');
            fetchDashboardStats();
        });

        return () => {
            socket.off('incoming_call_alert');
            socket.off('call_status_update');
            socket.off('new_message');
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [timeRange]);

    // Auto-hide tooltip after 8 sec
    useEffect(() => {
        if (showTooltip) {
            const timer = setTimeout(() => setShowTooltip(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [showTooltip]);

    // Initial Load
    useEffect(() => {
        fetchDashboardStats();
        const t = setTimeout(() => setShowInitialLoader(false), LOADER_DURATION_MS);
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => {
            clearTimeout(t);
            clearInterval(interval);
        };
    }, [timeRange]);

    const getChangeColor = (change) => {
        if (change === "N/A") return "text-gray-400";
        return change.startsWith('+') ? "text-emerald-500" : "text-rose-500";
    };

    const rangeOptions = [
        { value: 'weekly', label: 'Last 7 Days' },
        { value: 'monthly', label: 'Last 30 Days' },
        { value: 'quarterly', label: 'Last 3 Months' },
    ];

    if (showInitialLoader) {
        return (
            <div className="fixed inset-0 bg-gray-50 dark:bg-slate-900 flex items-center justify-center z-50">
                <div className="relative flex flex-col items-center">
                    <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900 rounded-full animate-spin border-t-indigo-600"></div>
                    <p className="mt-4 text-indigo-600 font-medium animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const completedCount = stats.completed || (stats.totalCalls > 0 ? Math.round(stats.totalCalls * (parseFloat(stats.successRate) / 100)) : 0);
    const missedCount = stats.missed || (stats.totalCalls - completedCount);

    const donutData = { completed: completedCount, missed: missedCount, total: stats.totalCalls };

    // Hourly Message Activity Chart Component
    const HourlyMessageChart = ({ data }) => {
        if (!data || data.length === 0) {
            return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;
        }

        const maxValue = Math.max(...data.map(d => Math.max(d.single || 0, d.bulk || 0, d.inbox || 0)));
        const yAxisMax = Math.ceil(maxValue / 5) * 5 || 10; // Round up to nearest 5

        return (
            <div className="relative h-72 w-full pt-6">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pl-10 pb-8">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full border-t border-gray-200 dark:border-gray-700/30 h-0 opacity-50"></div>
                    ))}
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] text-gray-400 font-medium py-1">
                    {[yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25, 0].map((val, i) => (
                        <div key={i} className="text-right pr-2">{Math.round(val)}</div>
                    ))}
                </div>

                {/* Chart area */}
                <div className="ml-10 h-full pb-8 flex items-end justify-between gap-1 px-1">
                    {data.map((item, index) => {
                        const singleHeight = ((item.single || 0) / yAxisMax) * 100;
                        const bulkHeight = ((item.bulk || 0) / yAxisMax) * 100;
                        const inboxHeight = ((item.inbox || 0) / yAxisMax) * 100;

                        // Show label every 3 hours to avoid clutter
                        const showLabel = index % 3 === 0;

                        return (
                            <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                {/* Hover Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] p-2 rounded pointer-events-none z-10 whitespace-nowrap shadow-xl border border-gray-700">
                                    <div className="font-bold mb-1 border-b border-gray-700 pb-1">{item.hour}</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div>Single: {item.single}</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div>Bulk: {item.bulk}</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-pink-500 rounded-full"></div>Inbox: {item.inbox}</div>
                                </div>

                                <div className="w-full flex items-end justify-center gap-[2px] h-full px-[1px]">
                                    {/* Single messages */}
                                    <div
                                        className="w-full max-w-[8px] bg-indigo-500 rounded-t-[2px] transition-all duration-300 group-hover:bg-indigo-400 relative"
                                        style={{ height: `${Math.min(singleHeight, 100)}%` }}
                                    ></div>
                                    {/* Bulk messages */}
                                    <div
                                        className="w-full max-w-[8px] bg-purple-500 rounded-t-[2px] transition-all duration-300 group-hover:bg-purple-400 relative"
                                        style={{ height: `${Math.min(bulkHeight, 100)}%` }}
                                    ></div>
                                    {/* Inbox messages */}
                                    <div
                                        className="w-full max-w-[8px] bg-pink-500 rounded-t-[2px] transition-all duration-300 group-hover:bg-pink-400 relative"
                                        style={{ height: `${Math.min(inboxHeight, 100)}%` }}
                                    ></div>
                                </div>

                                {/* X-axis label */}
                                <div className={`text-[10px] text-gray-500 dark:text-gray-400 mt-2 absolute -bottom-6 ${showLabel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                    {item.hour.split(':')[0]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div
            className="p-6 md:p-8 flex-grow overflow-y-auto relative bg-gray-50/50 dark:bg-slate-900/50"
            style={{ height: '100vh', paddingTop: `${NAVBAR_HEIGHT_PX + 24}px`, marginTop: `-${NAVBAR_HEIGHT_PX}px` }}
        >
            {/* Animated Background Mesh */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header: Title + Bell */}
            <div className="flex justify-between items-end mb-8 animate-enter">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
                        Dashboard Overview
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-yellow-500" /> Real-time performance metrics
                    </p>
                </div>

                <div className="relative">
                    {/* Tooltip */}
                    {showTooltip && recentIncomingCalls.length > 0 && (
                        <div className="absolute top-14 right-0 glass-card p-4 rounded-xl w-72 z-50 animate-enter">
                            <p className="font-bold text-sm text-gray-800 dark:text-white mb-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <BellIcon className="w-4 h-4 text-red-500" /> Recent Activity
                            </p>
                            {recentIncomingCalls.map(call => (
                                <div key={call.id} className="text-xs text-gray-600 dark:text-gray-300 py-2 flex justify-between items-center border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                    <span className="font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{call.from}</span>
                                    <span className="text-gray-400">{call.timestamp}</span>
                                </div>
                            ))}
                            <button
                                onClick={() => navigate('/real-time-dialer')}
                                className="mt-3 w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                            >
                                Open Dialer
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="glass-card border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded-xl flex items-start animate-enter">
                    <ExclamationCircleIcon className="w-5 h-5 mr-2 mt-0.5" />
                    <div>
                        <strong className="block font-bold">System Alert</strong>
                        <span className="text-sm">{error}</span>
                    </div>
                </div>
            )}

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <div className="animate-enter" style={{ animationDelay: '0.1s' }}>
                    <StatsCard
                        title={<span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider text-xs">TOTAL CALLS</span>}
                        value={stats.totalCalls}
                        subtitle="All calls"
                        change={stats.totalChange}
                        icon={<PhoneIcon className="w-5 h-5 text-indigo-600" />}
                        changeColor={getChangeColor(stats.totalChange)}
                        timeRangeLabel={rangeOptions.find(o => o.value === timeRange)?.label}
                        isLoading={isLoadingData}
                        color="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 shadow-sm hover:shadow-md transition-all duration-300"
                        borderColor="bg-indigo-500"
                    />
                </div>
                <div className="animate-enter" style={{ animationDelay: '0.2s' }}>
                    <StatsCard
                        title={<span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wider text-xs">SUCCESS RATE</span>}
                        value={stats.successRate}
                        subtitle="Answered ratio"
                        change={stats.completedChange}
                        icon={<CheckCircleIcon className="w-5 h-5 text-emerald-600" />}
                        changeColor={getChangeColor(stats.completedChange)}
                        timeRangeLabel={rangeOptions.find(o => o.value === timeRange)?.label}
                        isLoading={isLoadingData}
                        color="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 shadow-sm hover:shadow-md transition-all duration-300"
                        borderColor="bg-emerald-500"
                    />
                </div>
                <div className="animate-enter" style={{ animationDelay: '0.3s' }}>
                    <StatsCard
                        title={<span className="text-amber-600 dark:text-amber-400 font-bold tracking-wider text-xs">PEAK HOURS</span>}
                        value={stats.peakHours}
                        subtitle="Busiest time"
                        change="N/A"
                        icon={<BoltIcon className="w-5 h-5 text-amber-600" />}
                        changeColor="text-gray-400"
                        timeRangeLabel={rangeOptions.find(o => o.value === timeRange)?.label}
                        isLoading={isLoadingData}
                        color="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 shadow-sm hover:shadow-md transition-all duration-300"
                        borderColor="bg-amber-500"
                    />
                </div>
                <div className="animate-enter" style={{ animationDelay: '0.4s' }}>
                    <StatsCard
                        title={<span className="text-pink-600 dark:text-pink-400 font-bold tracking-wider text-xs">MESSAGES</span>}
                        value={stats.totalMessages}
                        subtitle="Sent total"
                        change="N/A"
                        icon={<ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-600" />}
                        changeColor="text-gray-400"
                        timeRangeLabel={rangeOptions.find(o => o.value === timeRange)?.label}
                        isLoading={isLoadingData}
                        color="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 shadow-sm hover:shadow-md transition-all duration-300"
                        borderColor="bg-pink-500"
                    />
                </div>
                <div className="animate-enter" style={{ animationDelay: '0.5s' }}>
                    <StatsCard
                        title={<span className="text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs">USERS</span>}
                        value={stats.totalUsers}
                        subtitle="Active now"
                        change="N/A"
                        icon={<UsersIcon className="w-5 h-5 text-blue-600" />}
                        changeColor="text-gray-400"
                        timeRangeLabel={rangeOptions.find(o => o.value === timeRange)?.label}
                        isLoading={isLoadingData}
                        color="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/20 shadow-sm hover:shadow-md transition-all duration-300"
                        borderColor="bg-blue-500"
                    />
                </div>
            </div>

            {/* Module Access - Glass Bar */}
            <div className="glass-card rounded-2xl p-6 mb-8 animate-enter" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Quick Access Modules</h3>
                <div className="flex flex-wrap gap-4">
                    <span className="px-5 py-2.5 bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                        📞 Dialer
                    </span>
                    <span className="px-5 py-2.5 bg-gradient-to-r from-blue-500/10 to-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                        💬 Messaging
                    </span>
                    <span className="px-5 py-2.5 bg-gradient-to-r from-amber-500/10 to-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                        👥 Contacts
                    </span>
                    <span className="px-5 py-2.5 bg-gradient-to-r from-purple-500/10 to-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                        ⚡ Flows
                    </span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                <div className="lg:col-span-3 glass-card rounded-2xl p-6 animate-enter" style={{ animationDelay: '0.7s' }}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <PhoneIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Call Volume Trends
                    </h3>
                    {isLoadingData ? (
                        <div className="h-64 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Loading Chart...</div>
                    ) : (
                        <Chart data={stats.callVolume} timeRange={timeRange} type="line" />
                    )}
                </div>

                <div className="lg:col-span-2 glass-card rounded-2xl p-6 animate-enter" style={{ animationDelay: '0.8s' }}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        Call Status Distribution
                    </h3>
                    <Chart data={donutData} type="donut" />
                </div>
            </div>

            {/* Hourly Message Activity Chart */}
            <div className="glass-card rounded-2xl p-6 animate-enter" style={{ animationDelay: '0.9s' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                <ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                            </div>
                            Hourly Message Activity
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">Real-time breakdown of message traffic</p>
                    </div>
                    {/* Legend */}
                    <div className="flex gap-4 text-xs font-bold bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                            <span className="text-gray-600 dark:text-gray-300">Single</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                            <span className="text-gray-600 dark:text-gray-300">Bulk</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-pink-500 rounded-sm"></div>
                            <span className="text-gray-600 dark:text-gray-300">Inbox</span>
                        </div>
                    </div>
                </div>
                {isLoadingData ? (
                    <div className="h-64 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Loading Chart...</div>
                ) : (
                    <HourlyMessageChart data={stats.hourlyMessageActivity} />
                )}
            </div>
        </div>
    );
};

export default Dashboard;