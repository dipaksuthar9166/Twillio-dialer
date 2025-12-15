import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { EnvelopeIcon, CheckBadgeIcon, TrashIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CalendarDaysIcon, UserGroupIcon, ClockIcon as ClockIconSolid, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;

// Helper functions
const getAuthHeaders = () => {
    const token = localStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};
const getStatusBadge = (status) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full uppercase';
    switch (status?.toLowerCase()) {
        case 'completed': return `${base} bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300`;
        case 'pending': return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300`;
        case 'failed': return `${base} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
        default: return `${base} bg-gray-100 text-gray-700`;
    }
};

// Campaign Edit Modal
const CampaignEditModal = ({ isOpen, onClose, campaign, onSave }) => {
    const [name, setName] = useState(campaign?.name || '');
    const [messageContent, setMessageContent] = useState(campaign?.messageContent || '');
    const [targetGroup, setTargetGroup] = useState(campaign?.targetGroup || 'Select Group');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const isSaveDisabled = isSaving || !name.trim() || !messageContent.trim();

    useEffect(() => {
        if (campaign) {
            setName(campaign.name);
            setMessageContent(campaign.messageContent);
            setTargetGroup(campaign.targetGroup);
            setError(null);
            setIsSaving(false);
        }
    }, [campaign]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaveDisabled) return;

        setIsSaving(true);
        setError(null);

        const updatedData = {
            id: campaign.id,
            name: name.trim(),
            messageContent: messageContent.trim(),
            targetGroup: targetGroup,
        };

        try {
            // Simulate API Success
            await new Promise(resolve => setTimeout(resolve, 800));
            onSave(updatedData);
            onClose();
        } catch (err) {
            console.error("Campaign update error:", err);
            setError(err.response?.data?.message || "Failed to update campaign. Check API.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !campaign) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl mx-4 p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Campaign: {campaign.name}</h3>
                    <XMarkIcon className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-800" onClick={onClose} />
                </div>

                {error && <div className="p-2 mb-4 text-sm bg-red-100 text-red-700 rounded dark:bg-red-900/50 dark:text-red-300">{error}</div>}

                <form onSubmit={handleSave}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSaving} required />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Contact Group</label>
                        <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSaving} required>
                            <option value="Select Group" disabled>Select Group</option>
                            <option value="Group A">Group A ({campaign.totalRecipients})</option>
                            <option value="Group B">Group B</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Content</label>
                        <textarea value={messageContent} onChange={(e) => setMessageContent(e.target.value)}
                            rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isSaving} required />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
                            disabled={isSaveDisabled}
                        >
                            {isSaving ? <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main Component
const CampaignReportPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [perPage, setPerPage] = useState('10');
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = parseInt(perPage);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState(null);

    const stats = {
        totalCampaigns: campaigns.length,
        completed: campaigns.filter(c => c.status?.toLowerCase() === 'completed').length,
        pending: campaigns.filter(c => ['pending', 'scheduled', 'inprogress'].includes(c.status?.toLowerCase())).length,
        thisMonth: campaigns.filter(c => {
            const campaignDate = new Date(c.createdDate);
            const now = new Date();
            return campaignDate.getMonth() === now.getMonth() && campaignDate.getFullYear() === now.getFullYear();
        }).length,
    };

    useEffect(() => {
        const fetchCampaigns = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/bulk/campaigns`, { headers: getAuthHeaders() });
                if (response.data.success) {
                    setCampaigns(response.data.campaigns || []);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch campaigns.');
                }
            } catch (err) {
                setError("Failed to load campaigns from API.");
                setCampaigns([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleRowSelect = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleViewEdit = (campaign) => {
        setCampaignToEdit(campaign);
        setIsEditModalOpen(true);
    };

    const handleCampaignSave = (updatedData) => {
        setCampaigns(prev => prev.map(c =>
            c.id === updatedData.id ? { ...c, ...updatedData } : c
        ));
        setCampaignToEdit(null);
        setIsEditModalOpen(false);
    };

    const handleDeleteSelected = async () => {
        if (selectedRows.length === 0) {
            alert("Please select campaigns to delete.");
            return;
        }
        if (!window.confirm(`Are you sure you want to permanently delete ${selectedRows.length} campaign(s)?`)) {
            return;
        }

        try {
            const response = await axios.delete(`${API_BASE_URL}/bulk/campaign`, {
                data: { ids: selectedRows },
                headers: getAuthHeaders(),
            });

            if (response.status === 200 || response.data.success) {
                setCampaigns(campaigns.filter(c => !selectedRows.includes(c.id)));
                setSelectedRows([]);
                alert("Campaign(s) deleted successfully! ✅");
            } else {
                throw new Error(response.data.message || "Server did not confirm deletion.");
            }

        } catch (error) {
            console.error("Error deleting campaigns:", error);
            const errorMessage = error.response?.data?.message || error.message;
            alert(`Failed to delete campaign(s). Check API endpoint: ${errorMessage}`);
            setError(errorMessage);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [perPage]);

    const filteredCampaigns = campaigns.filter(campaign =>
        (campaign.name && campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (campaign.status && campaign.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalFilteredRecords = filteredCampaigns.length;
    const totalPages = Math.ceil(totalFilteredRecords / logsPerPage);
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = Math.min(startIndex + logsPerPage, totalFilteredRecords);
    const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);

    const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    return (
        <div
            className="p-8 bg-gray-50 dark:bg-gray-900 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            <CampaignEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                campaign={campaignToEdit}
                onSave={handleCampaignSave}
            />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Campaign Reports</h1>
                <p className="text-gray-500 dark:text-gray-400">Overview of your campaign performance and history.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title={<span className="text-indigo-600 font-bold">TOTAL CAMPAIGNS</span>}
                    value={stats.totalCampaigns}
                    subtitle="All time"
                    icon={<EnvelopeIcon className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-50"
                    borderColor="bg-indigo-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title={<span className="text-green-600 font-bold">COMPLETED</span>}
                    value={stats.completed}
                    subtitle="Successfully sent"
                    icon={<CheckBadgeIcon className="w-6 h-6 text-green-600" />}
                    color="bg-green-50"
                    borderColor="bg-green-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title={<span className="text-yellow-600 font-bold">PENDING</span>}
                    value={stats.pending}
                    subtitle="Scheduled or In Progress"
                    icon={<ClockIconSolid className="w-6 h-6 text-yellow-600" />}
                    color="bg-yellow-50"
                    borderColor="bg-yellow-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title={<span className="text-pink-600 font-bold">THIS MONTH</span>}
                    value={stats.thisMonth}
                    subtitle="Created this month"
                    icon={<CalendarDaysIcon className="w-6 h-6 text-pink-600" />}
                    color="bg-pink-50"
                    borderColor="bg-pink-500"
                    isLoading={isLoading}
                />
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 justify-between items-end">
                <div className="w-full md:w-96">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Search Campaigns</label>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, status or ID..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto items-end">
                    <div className="w-24">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Per Page</label>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            disabled={isLoading}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                    </div>

                    <button
                        onClick={handleDeleteSelected}
                        className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 flex items-center gap-2 font-semibold h-[38px] ${selectedRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} dark:bg-red-700 dark:hover:bg-red-800`}
                        disabled={selectedRows.length === 0 || isLoading}
                    >
                        <TrashIcon className="w-5 h-5" /> Delete Selected
                    </button>
                </div>
            </div>

            {/* Campaign History Table */}
            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 p-6 border-b dark:border-gray-700">Campaign History</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left w-10">
                                    <input type="checkbox"
                                        onChange={() => setSelectedRows(currentCampaigns.length === selectedRows.length ? [] : currentCampaigns.map(c => c.id))}
                                        checked={currentCampaigns.length > 0 && selectedRows.length === currentCampaigns.length}
                                        className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                                    />
                                </th>
                                {['#', 'Campaign Name', 'Created Date', 'Status', 'Actions'].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 dark:text-gray-400">Loading campaigns...</td></tr>
                            ) : totalFilteredRecords === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-500 dark:text-gray-400">No campaigns found for current search/filters.</td></tr>
                            ) : (
                                currentCampaigns.map((campaign, index) => (
                                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-100">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input type="checkbox"
                                                onChange={() => handleRowSelect(campaign.id)}
                                                checked={selectedRows.includes(campaign.id)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{startIndex + index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{campaign.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{campaign.createdDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={getStatusBadge(campaign.status)}>{campaign.status.toUpperCase()}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                                onClick={() => handleViewEdit(campaign)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                View/Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalFilteredRecords > logsPerPage && (
                    <div className="p-4 border-t bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300 font-medium flex justify-between items-center">
                        <span>Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalFilteredRecords}</strong> total filtered records.</span>
                        <div className="flex gap-1 items-center">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 transition dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="px-2 py-1 text-gray-800 dark:text-gray-100 font-bold">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 transition dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition z-40">
                {/* Placeholder icon */}
            </button>
        </div>
    );
};

export default CampaignReportPage;