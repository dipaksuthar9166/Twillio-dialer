import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import {
    ClockIcon,
    PaperAirplaneIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    UserGroupIcon,
    PencilSquareIcon,
    ChatBubbleLeftRightIcon,
    InboxStackIcon,
    ListBulletIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';
import SMSLogsTable from '../components/SmsLogsTable';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;
const MAX_BULK_CHARS = 1000;

// --- Helper Functions ---
const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// returns datetime-local string (adds 5 min buffer so default schedule isn't in past)
const getLocalDatetimeString = () => {
    const now = new Date(Date.now() + 5 * 60000);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getCurrentLocalDatetimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Normalize numbers from backend (accept strings or objects)
const normalizeTwilioNumbers = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        // common shapes: { phoneNumber, number, friendlyName, value }
        return item.phoneNumber || item.number || item.value || item.friendlyName || item.sid || JSON.stringify(item);
    }).filter(Boolean);
};

// --- Main Component ---
const BulkMessaging = () => {
    // --- State Management ---
    const [view, setView] = useState('list');
    const [campaignTitle, setCampaignTitle] = useState('');
    const [senderIdType, setSenderIdType] = useState('Local');

    // Twilio States
    const [selectedTwilioNumber, setSelectedTwilioNumber] = useState('');
    const [availableTwilioNumbers, setAvailableTwilioNumbers] = useState([]);
    const [twilioError, setTwilioError] = useState(null);

    // CAMPAIGN LIST STATES
    const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
    const [isCampaignsLoading, setIsCampaignsLoading] = useState(false);

    // CONTACT GROUP STATES
    const [contactGroup, setContactGroup] = useState('');
    const [availableContactGroups, setAvailableContactGroups] = useState([]);
    const [isGroupsLoading, setIsGroupsLoading] = useState(true);
    const [contactGroupCount, setContactGroupCount] = useState(0);

    // TEMPLATE STATES
    const [smsTemplate, setSmsTemplate] = useState(''); // will hold template.id
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);

    const [dateTime, setDateTime] = useState(getLocalDatetimeString());
    const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [messageContent, setMessageContent] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // --- Dynamic Stats --- 
    const charactersUsed = messageContent.length;
    const smsCount = charactersUsed === 0 ? 0 : Math.ceil(charactersUsed / 160);
    const stats = {
        availableGroups: availableContactGroups.length,
        selectedContacts: contactGroupCount,
        smsTemplates: availableTemplates.length,
        messageLength: smsCount > 0 ? `${smsCount} SMS` : '0 SMS',
    };

    // --- Data Fetching: Twilio Numbers ---
    const fetchTwilioNumbers = async () => {
        setTwilioError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/from-numbers`, { headers: getAuthHeaders() });
            // backend might return { numbers: [...] } or an array directly
            const raw = response.data?.numbers ?? response.data ?? [];
            const numbers = normalizeTwilioNumbers(raw);

            setAvailableTwilioNumbers(numbers);
            if (numbers.length > 0) {
                setSelectedTwilioNumber(numbers[0]);
            } else {
                setSelectedTwilioNumber('');
                setTwilioError("No sender numbers found in your Twilio configuration. Please check the backend.");
                setError(prev => prev || "Twilio Sender Number is missing or unavailable.");
            }
        } catch (err) {
            console.error("Failed to fetch Twilio numbers:", err);
            const errMsg = err.response?.data?.message || err.message || 'Unknown error';
            setTwilioError(`Failed to load Twilio numbers: ${errMsg}`);
            setError(prev => prev || `Twilio API Connection Failed. Check server URL/config.`);
            setAvailableTwilioNumbers([]);
            setSelectedTwilioNumber('');
        }
    };

    // --- Data Fetching: Contact Groups ---
    const fetchContactGroups = async () => {
        setIsGroupsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/contact-groups/all`, { headers: getAuthHeaders() });
            if (response.data?.success) {
                const fetchedGroups = response.data.groups || [];
                setAvailableContactGroups(fetchedGroups);
            } else if (Array.isArray(response.data)) {
                // fallback: backend returned array directly
                setAvailableContactGroups(response.data);
            } else {
                console.error("Group API returned failure or unexpected shape:", response.data);
                setAvailableContactGroups([]);
            }
        } catch (err) {
            console.error("Failed to fetch contact groups:", err);
            setError(prev => prev || "Contact groups could not be loaded.");
            setAvailableContactGroups([]);
        } finally {
            setIsGroupsLoading(false);
        }
    };

    // --- Data Fetching: Templates ---
    const fetchTemplates = async () => {
        setIsTemplatesLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/templates/all`, { headers: getAuthHeaders() });
            // prefer response.data.templates else fallback to array
            const templatesData = response.data?.templates ?? response.data ?? [];
            setAvailableTemplates(templatesData);
        } catch (err) {
            console.error("Failed to fetch templates:", err);
            setAvailableTemplates([]);
        } finally {
            setIsTemplatesLoading(false);
        }
    };

    // Data Fetching for Scheduled Campaigns
    const fetchScheduledCampaigns = async () => {
        setIsCampaignsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/campaign/scheduled`, { headers: getAuthHeaders() });
            const campaigns = response.data?.campaigns ?? response.data ?? [];
            setScheduledCampaigns(campaigns);
        } catch (err) {
            console.error("Failed to fetch scheduled campaigns:", err);
            setError(prev => prev || "Failed to load scheduled campaigns list.");
            setScheduledCampaigns([]);
        } finally {
            setIsCampaignsLoading(false);
        }
    };

    // Delete Campaign Handler
    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm("Are you sure you want to delete this scheduled campaign? This action cannot be undone.")) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/campaign/delete/${campaignId}`, { headers: getAuthHeaders() });
            window.alert("✅ Campaign deleted successfully.");
            fetchScheduledCampaigns();
        } catch (err) {
            console.error(`Failed to delete campaign ${campaignId}:`, err);
            window.alert(`❌ Deletion Failed: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        }
    };

    // Initial Data Fetching Effect
    useEffect(() => {
        let cancelled = false;
        if (view === 'list') {
            const loadInitialData = async () => {
                setError(null);
                setTwilioError(null);
                setIsLoading(true);

                const twilioPromise = fetchTwilioNumbers();
                const groupPromise = fetchContactGroups();
                const templatePromise = fetchTemplates();

                await Promise.all([twilioPromise, groupPromise, templatePromise]);
                if (!cancelled) setIsLoading(false);
            };
            loadInitialData();
        }

        if (view === 'campaigns') {
            fetchScheduledCampaigns();
        }

        return () => { cancelled = true; };
    }, [view]);

    // Sync contact group count when group changes
    useEffect(() => {
        const selected = availableContactGroups.find(g => String(g.id) === String(contactGroup));
        setContactGroupCount(selected ? (selected.totalContacts ?? selected.count ?? 0) : 0);
    }, [contactGroup, availableContactGroups]);

    // When template selected, set messageContent from template.content
    useEffect(() => {
        if (smsTemplate) {
            const template = availableTemplates.find(t => String(t.id) === String(smsTemplate));
            if (template) {
                setMessageContent(template.content ?? '');
            }
        }
    }, [smsTemplate, availableTemplates]);

    // Action Handlers
    const handleViewHistory = () => {
        setView('campaigns');
    };

    const formatScheduleTime = (datetimeLocalString) => {
        return datetimeLocalString.replace('T', ' ');
    }

    const preparePayload = () => ({
        campaignTitle,
        contactGroupId: contactGroup,
        smsTemplateId: smsTemplate,
        messageContent,
        senderNumber: selectedTwilioNumber,
        scheduledDateTime: formatScheduleTime(dateTime),
        timeZone,
    });

    // SEND NOW HANDLER
    const handleSendNow = async (e) => {
        e.preventDefault();

        if (!selectedTwilioNumber || availableTwilioNumbers.length === 0) {
            setError(twilioError || "Twilio Sender Number is missing or unavailable. Cannot proceed.");
            return;
        }

        if (!campaignTitle || !contactGroup || !smsTemplate || !messageContent) {
            setError("Campaign Title, Contact Group, SMS Template, and Message Content are required.");
            return;
        }

        if (charactersUsed === 0 || charactersUsed > MAX_BULK_CHARS) {
            setError(`Message content is either empty or exceeds the maximum length of ${MAX_BULK_CHARS} characters.`);
            return;
        }

        const payload = preparePayload();

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/bulk/send-now`, payload, { headers: getAuthHeaders() });
            window.alert(`✅ Send Success: ${response.data?.message || 'Bulk message queued for sending.'}`);
            setView('history');
        } catch (err) {
            console.error("Send Now Failed:", err);
            setError(`❌ Send Failed: ${err.response?.data?.message || err.message || 'An unknown error occurred during send.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // SCHEDULE CAMPAIGN HANDLER
    const handleScheduleCampaign = async (e) => {
        e.preventDefault();

        if (!selectedTwilioNumber || availableTwilioNumbers.length === 0) {
            setError(twilioError || "Twilio Sender Number is missing or unavailable. Cannot proceed.");
            return;
        }

        if (!campaignTitle || !contactGroup || !smsTemplate || !messageContent) {
            setError("Campaign Title, Contact Group, SMS Template, and Message Content are required.");
            return;
        }

        // Check if schedule time is in the past
        const selectedTime = new Date(dateTime).getTime();
        const currentTime = Date.now();

        if (selectedTime < currentTime) {
            setError("Scheduled time must be in the future.");
            return;
        }

        const payload = preparePayload();

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/bulk/schedule`, payload, { headers: getAuthHeaders() });
            window.alert(`✅ Campaign Scheduled: ${response.data?.message || 'Campaign scheduled successfully.'}`);
            setView('campaigns');
        } catch (err) {
            console.error("Schedule Failed:", err);
            setError(`❌ Schedule Failed: ${err.response?.data?.message || err.message || 'An unknown error occurred during scheduling.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormIncomplete = !campaignTitle || !contactGroup || !selectedTwilioNumber || !smsTemplate || !messageContent;

    // -------------------------------------------------------------------------
    // RENDER: Scheduled Campaigns
    // -------------------------------------------------------------------------
    if (view === 'campaigns') {
        return (
            <div
                className="p-8 bg-[#FDF8F9] dark:bg-gray-900 flex-grow overflow-y-auto font-inter"
                style={{
                    height: '100vh',
                    paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                    marginTop: `-${NAVBAR_HEIGHT_PX}px`
                }}
            >
                {/* Background Blobs */}
                <div className="absolute inset-0 pointer-events-none opacity-40 fixed">
                    <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-purple-200/50 blur-[120px]" />
                    <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-pink-200/50 blur-[120px]" />
                    <div className="absolute bottom-0 right-20 w-[300px] h-[300px] bg-rose-200/50 blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Campaign Management</p>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                                <CalendarDaysIcon className="w-8 h-8 text-rose-500" /> Scheduled Campaigns
                            </h1>
                        </div>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => setView('list')}
                                className="px-5 py-2.5 bg-white text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-50 transition duration-200 flex items-center gap-2 font-bold shadow-sm"
                            >
                                <PlusIcon className="w-5 h-5" /> New Campaign
                            </button>
                            <button
                                onClick={() => setView('history')}
                                className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center gap-2 font-bold shadow-sm"
                            >
                                <InboxStackIcon className="w-5 h-5" /> View Sent Logs
                            </button>
                        </div>
                    </header>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 text-red-700 dark:text-red-300 p-4 mb-6 rounded-2xl flex items-center font-medium shadow-sm" role="alert">
                            <ExclamationTriangleIcon className='w-5 h-5 mr-3 flex-shrink-0' />
                            {error}
                        </div>
                    )}

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/50 dark:border-gray-700 rounded-[32px] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className='text-lg font-bold text-gray-800 dark:text-gray-100'>Pending Campaigns ({scheduledCampaigns.length})</h2>
                        </div>

                        {isCampaignsLoading ? (
                            <div className='py-20 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400'>
                                <ArrowPathIcon className='w-8 h-8 animate-spin mb-3 text-rose-400' />
                                <p className="font-medium">Loading scheduled campaigns...</p>
                            </div>
                        ) : scheduledCampaigns.length === 0 ? (
                            <div className='py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500'>
                                <CalendarDaysIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">No campaigns are currently scheduled.</p>
                                <p className="text-sm">Create a new campaign to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                    <thead className="bg-gray-50/50 dark:bg-gray-700/30">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Title</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Group</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Recipients</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Schedule Time</th>
                                            <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-gray-100 dark:divide-gray-700">
                                        {scheduledCampaigns.map((campaign) => (
                                            <tr key={campaign.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-800 dark:text-gray-100">{campaign.campaignTitle}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{campaign.groupName || 'N/A'}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{campaign.recipientCount ?? campaign.recipient_count ?? 0}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{campaign.scheduledDateTime ? new Date(campaign.scheduledDateTime).toLocaleString() : 'N/A'}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${campaign.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-700' :
                                                        campaign.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {campaign.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                    {campaign.status === 'Scheduled' ? (
                                                        <button
                                                            onClick={() => handleDeleteCampaign(campaign.id)}
                                                            className="text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            title='Cancel Campaign'
                                                        >
                                                            <TrashIcon className='w-5 h-5' />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER: History (Sent Logs)
    // -------------------------------------------------------------------------
    if (view === 'history') {
        return (
            <div
                className="p-8 bg-[#FDF8F9] dark:bg-gray-900 flex-grow overflow-y-auto font-inter"
                style={{
                    height: '100vh',
                    paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                    marginTop: `-${NAVBAR_HEIGHT_PX}px`
                }}
            >
                {/* Background Blobs */}
                <div className="absolute inset-0 pointer-events-none opacity-40 fixed">
                    <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-purple-200/50 blur-[120px]" />
                    <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-pink-200/50 blur-[120px]" />
                    <div className="absolute bottom-0 right-20 w-[300px] h-[300px] bg-rose-200/50 blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Analytics & Logs</p>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                                <InboxStackIcon className="w-8 h-8 text-indigo-500" /> Recent History
                            </h1>
                        </div>
                        <div className='flex gap-3'>
                            <button
                                onClick={() => setView('campaigns')}
                                className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center gap-2 font-bold shadow-sm"
                            >
                                <CalendarDaysIcon className="w-5 h-5" /> Scheduled Campaigns
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className="px-5 py-2.5 bg-white text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-50 transition duration-200 flex items-center gap-2 font-bold shadow-sm"
                            >
                                <ArrowPathIcon className="w-5 h-5 -rotate-90" /> Back to Campaign Form
                            </button>
                        </div>
                    </header>

                    <div className="mt-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/50 dark:border-gray-700 rounded-[32px] shadow-sm overflow-hidden p-6">
                        <SMSLogsTable isBulkLogs={true} />
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // RENDER: Form (Default)
    // -------------------------------------------------------------------------
    return (
        <div
            className="p-8 bg-[#FDF8F9] dark:bg-gray-900 flex-grow overflow-y-auto font-inter"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            {/* Background Blobs */}
            <div className="absolute inset-0 pointer-events-none opacity-40 fixed">
                <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-purple-200/50 blur-[120px]" />
                <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-pink-200/50 blur-[120px]" />
                <div className="absolute bottom-0 right-20 w-[300px] h-[300px] bg-rose-200/50 blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Marketing Automation</p>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Bulk SMS Campaign</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Create and send bulk SMS campaigns to multiple recipients</p>
                    </div>
                    <div className='flex gap-3'>
                        <button
                            onClick={() => setView('campaigns')}
                            className={`px-5 py-2.5 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white border border-gray-200 rounded-xl transition duration-200 flex items-center gap-2 font-bold shadow-sm`}
                        >
                            <ListBulletIcon className="w-5 h-5 text-rose-400" /> Scheduled
                        </button>
                        <button
                            onClick={() => setView('history')}
                            className={`px-5 py-2.5 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white border border-gray-200 rounded-xl transition duration-200 flex items-center gap-2 font-bold shadow-sm`}
                        >
                            <ClockIcon className="w-5 h-5 text-indigo-400" /> History
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title={<span className="text-purple-600 font-bold">AVAILABLE GROUPS</span>}
                        value={stats.availableGroups}
                        subtitle="Contact groups"
                        change="Stable"
                        icon={<UserGroupIcon className="w-6 h-6 text-purple-600" />}
                        color="bg-purple-50"
                        borderColor="bg-purple-400"
                        isLoading={isLoading || isGroupsLoading}
                    />
                    <StatsCard
                        title={<span className="text-emerald-600 font-bold">SELECTED CONTACTS</span>}
                        value={stats.selectedContacts}
                        subtitle="Recipients in group"
                        change="Good"
                        icon={<UserGroupIcon className="w-6 h-6 text-emerald-600" />}
                        color="bg-emerald-50"
                        borderColor="bg-emerald-400"
                        isLoading={isLoading || isGroupsLoading}
                    />
                    <StatsCard
                        title={<span className="text-amber-600 font-bold">SMS TEMPLATES</span>}
                        value={stats.smsTemplates}
                        subtitle="Available templates"
                        change="Stable"
                        icon={<PencilSquareIcon className="w-6 h-6 text-amber-600" />}
                        color="bg-amber-50"
                        borderColor="bg-amber-400"
                        isLoading={isTemplatesLoading}
                    />
                    <StatsCard
                        title={<span className="text-rose-600 font-bold">MESSAGE LENGTH</span>}
                        value={stats.messageLength}
                        subtitle={`${charactersUsed} chars`}
                        change="Good"
                        icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-rose-600" />}
                        color="bg-rose-50"
                        borderColor="bg-rose-400"
                        isLoading={isLoading}
                    />
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 text-red-700 dark:text-red-300 p-4 mb-6 rounded-2xl flex items-center font-medium shadow-sm" role="alert">
                        <ExclamationTriangleIcon className='w-5 h-5 mr-3 flex-shrink-0' />
                        {error}
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm rounded-[32px] p-8 border border-white/60 dark:border-gray-700">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Column */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 text-sm">01</span>
                                    Campaign Details
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Campaign Title <span className='text-rose-500'>*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter Campaign Title (e.g., Q4 Promo)"
                                            value={campaignTitle}
                                            onChange={(e) => setCampaignTitle(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 text-base transition-all outline-none"
                                            disabled={isLoading || isSubmitting}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Sender ID Type</label>
                                        <select
                                            value={senderIdType}
                                            onChange={(e) => setSenderIdType(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 text-base transition-all outline-none"
                                            disabled={isLoading || isSubmitting}
                                        >
                                            <option value="Local">Local</option>
                                            <option value="International">International</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Twilio Sender Number <span className='text-rose-500'>*</span></label>
                                        {isLoading ? (
                                            <div className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 flex items-center">
                                                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> Loading numbers...
                                            </div>
                                        ) : availableTwilioNumbers.length === 0 ? (
                                            <div className="w-full border border-red-200 rounded-xl px-4 py-3 bg-red-50 text-red-600 font-medium text-sm">
                                                {twilioError || "No numbers available."}
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedTwilioNumber}
                                                onChange={(e) => setSelectedTwilioNumber(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 text-base transition-all outline-none font-mono"
                                                disabled={isSubmitting}
                                                required
                                            >
                                                <option value="">Select a number</option>
                                                {availableTwilioNumbers.map((number, idx) => (
                                                    <option key={`${number}-${idx}`} value={number}>{number}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm">03</span>
                                    Schedule (Optional)
                                </h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Date and Time</label>
                                        <input
                                            type="datetime-local"
                                            value={dateTime}
                                            onChange={(e) => setDateTime(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 text-base transition-all outline-none"
                                            disabled={isLoading || isSubmitting}
                                            min={getCurrentLocalDatetimeString()}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Time Zone</label>
                                        <input
                                            type="text"
                                            value={timeZone}
                                            readOnly
                                            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-500 cursor-default text-sm font-medium"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">02</span>
                                    Recipients & Content
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Contact Group <span className='text-rose-500'>*</span></label>
                                        <select
                                            value={contactGroup}
                                            onChange={(e) => setContactGroup(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 text-base transition-all outline-none"
                                            disabled={isGroupsLoading || isSubmitting}
                                            required
                                        >
                                            <option value="">Select Group</option>
                                            {isGroupsLoading ? (
                                                <option disabled>Loading groups...</option>
                                            ) : (
                                                availableContactGroups.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name} ({group.totalContacts ?? group.count ?? 0} contacts)</option>
                                                ))
                                            )}
                                        </select>
                                        {contactGroupCount > 0 && (
                                            <p className='text-xs text-emerald-600 mt-2 font-bold flex items-center'>
                                                <UserGroupIcon className="w-3 h-3 mr-1" /> Selected group contains {contactGroupCount} recipients.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">SMS Template <span className='text-rose-500'>*</span></label>
                                        <select
                                            value={smsTemplate}
                                            onChange={(e) => setSmsTemplate(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 text-base transition-all outline-none"
                                            disabled={isTemplatesLoading || isSubmitting}
                                            required
                                        >
                                            <option value="">Select SMS Template</option>
                                            {isTemplatesLoading ? (
                                                <option disabled>Loading templates...</option>
                                            ) : (
                                                availableTemplates.map(template => (
                                                    <option key={template.id} value={template.id}>{template.name}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Message Content Preview <span className='text-rose-500'>*</span></label>
                                        <div className="relative">
                                            <textarea
                                                value={messageContent}
                                                onChange={(e) => setMessageContent(e.target.value)}
                                                placeholder="Final message content will be displayed and edited here..."
                                                rows={6}
                                                className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 text-base transition-all outline-none resize-none"
                                                maxLength={MAX_BULK_CHARS}
                                                disabled={isSubmitting}
                                                required
                                            />
                                            <div className="absolute bottom-3 right-3 text-xs font-medium text-gray-400 bg-white/80 px-2 py-1 rounded-md">
                                                {charactersUsed}/{MAX_BULK_CHARS}
                                            </div>
                                        </div>
                                        <p className={`text-xs mt-2 font-bold ${charactersUsed > 160 ? 'text-amber-500' : 'text-gray-400'}`}>
                                            {smsCount} SMS segment(s) will be sent per contact.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 border-t border-gray-100 dark:border-gray-700 pt-8 mt-8">
                        <button
                            onClick={handleScheduleCampaign}
                            className="px-8 py-4 bg-white text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-all duration-200 flex items-center gap-2 font-bold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting || isFormIncomplete || availableTwilioNumbers.length === 0 || availableContactGroups.length === 0 || !!twilioError}
                        >
                            {isSubmitting ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <ClockIcon className="w-5 h-5" />
                            )}
                            Schedule for Later
                        </button>

                        <button
                            onClick={handleSendNow}
                            className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 font-bold shadow-lg shadow-rose-200 hover:shadow-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                            disabled={isSubmitting || isFormIncomplete || availableTwilioNumbers.length === 0 || availableContactGroups.length === 0 || !!twilioError}
                        >
                            {isSubmitting ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            ) : (
                                <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                            )}
                            Send Campaign Now
                        </button>
                    </div>
                </form>

                <button className="fixed bottom-8 right-8 bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-gray-800 transition transform hover:scale-105 z-50">
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default BulkMessaging;
