import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    PencilIcon,
    UserGroupIcon,
    UsersIcon,
    ArrowPathIcon,
    ChatBubbleBottomCenterTextIcon,
    XMarkIcon,
    CheckCircleIcon
} from '@heroicons/react/24/solid';
import StatsCard from '../components/StatsCard';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66;

const ContactGroupsPage = () => {
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentGroup, setCurrentGroup] = useState({ name: '', description: '', contacts: [] });
    const [availableContacts, setAvailableContacts] = useState([]);
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalGroups: 0,
        totalContacts: 0,
        avgContactsPerGroup: 0
    });

    const fetchGroups = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/contact-groups/all`);
            if (response.data.success) {
                const groupsData = response.data.groups || [];
                setGroups(groupsData);
                setFilteredGroups(groupsData);

                // Calculate stats
                const totalGroups = groupsData.length;
                const totalContacts = groupsData.reduce((sum, group) => sum + (group.totalContacts || 0), 0);
                const avgContactsPerGroup = totalGroups > 0 ? Math.round(totalContacts / totalGroups) : 0;

                setStats({ totalGroups, totalContacts, avgContactsPerGroup });
            } else {
                throw new Error(response.data.message || 'Failed to fetch groups');
            }
        } catch (err) {
            console.error("Error fetching groups:", err);
            setError(err.message || 'Failed to load contact groups.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchContacts = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await axios.get(`${API_BASE_URL}/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Adjust based on your actual contacts API response structure
            setAvailableContacts(response.data.contacts || response.data || []);
        } catch (err) {
            console.error("Error fetching contacts:", err);
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchContacts();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            setFilteredGroups(groups.filter(group =>
                group.name.toLowerCase().includes(lower) ||
                (group.description && group.description.toLowerCase().includes(lower))
            ));
        } else {
            setFilteredGroups(groups);
        }
    }, [searchTerm, groups]);

    const handleOpenModal = (group = null) => {
        if (group) {
            setIsEditMode(true);
            // Ensure we have the full group details including contacts if needed,
            // or fetch them if the list only has summary data.
            // For now assuming group object has what we need or we might need to fetch details.
            // If contacts are not in the group object, we might need to fetch them.
            // Let's assume for now we need to fetch group details to get the contacts list if not present.
            setCurrentGroup({
                id: group.id,
                name: group.name,
                description: group.description || '',
                contacts: group.contacts || [] // This might be just IDs or full objects depending on backend
            });
        } else {
            setIsEditMode(false);
            setCurrentGroup({ name: '', description: '', contacts: [] });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentGroup({ name: '', description: '', contacts: [] });
        setContactSearchTerm('');
    };

    const handleSaveGroup = async (e) => {
        e.preventDefault();
        if (!currentGroup.name.trim()) {
            alert("Group Name is required");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: currentGroup.name,
                description: currentGroup.description,
                contactIds: currentGroup.contacts // Assuming this is an array of IDs
            };

            if (isEditMode) {
                await axios.put(`${API_BASE_URL}/contact-groups/${currentGroup.id}`, payload);
            } else {
                await axios.post(`${API_BASE_URL}/contact-groups/create`, payload);
            }

            fetchGroups(); // Refresh list
            handleCloseModal();
        } catch (err) {
            console.error("Error saving group:", err);
            alert(`Failed to save group: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm("Are you sure you want to delete this group?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/contact-groups/${id}`);
            setGroups(prev => prev.filter(g => g.id !== id));
            setFilteredGroups(prev => prev.filter(g => g.id !== id));
        } catch (err) {
            console.error("Error deleting group:", err);
            alert("Failed to delete group.");
        }
    };

    const handleRowSelect = (id) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedRows.length === filteredGroups.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredGroups.map(g => g.id));
        }
    };

    const toggleContactSelection = (contactId) => {
        const currentContacts = currentGroup.contacts || [];
        if (currentContacts.includes(contactId)) {
            setCurrentGroup({
                ...currentGroup,
                contacts: currentContacts.filter(id => id !== contactId)
            });
        } else {
            setCurrentGroup({
                ...currentGroup,
                contacts: [...currentContacts, contactId]
            });
        }
    };

    // Filter available contacts for the modal
    const modalFilteredContacts = availableContacts.filter(c =>
        (c.name && c.name.toLowerCase().includes(contactSearchTerm.toLowerCase())) ||
        (c.firstName && c.firstName.toLowerCase().includes(contactSearchTerm.toLowerCase())) ||
        (c.lastName && c.lastName.toLowerCase().includes(contactSearchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(contactSearchTerm)) ||
        (c.number && c.number.includes(contactSearchTerm)) ||
        (c.phoneNumber && c.phoneNumber.includes(contactSearchTerm))
    );

    return (
        <div
            className="p-8 bg-gray-50 dark:bg-gray-900 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contact Groups</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Organize your contacts into manageable groups for targeted campaigns.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-md transition transform hover:scale-105"
                >
                    <PlusIcon className="w-5 h-5" /> Create Group
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatsCard
                    title="TOTAL GROUPS"
                    value={stats.totalGroups}
                    subtitle="Active contact groups"
                    icon={<UserGroupIcon className="w-6 h-6 text-indigo-600" />}
                    color="bg-indigo-50"
                    borderColor="bg-indigo-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="TOTAL CONTACTS"
                    value={stats.totalContacts}
                    subtitle="Across all groups"
                    icon={<UsersIcon className="w-6 h-6 text-green-600" />}
                    color="bg-green-50"
                    borderColor="bg-green-500"
                    isLoading={isLoading}
                />
                <StatsCard
                    title="AVG SIZE"
                    value={stats.avgContactsPerGroup}
                    subtitle="Contacts per group"
                    icon={<UserGroupIcon className="w-6 h-6 text-purple-600" />}
                    color="bg-purple-50"
                    borderColor="bg-purple-500"
                    isLoading={isLoading}
                />
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <button onClick={fetchGroups} className="p-2 text-gray-500 hover:text-indigo-600 transition">
                    <ArrowPathIcon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Groups Table */}
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={selectedRows.length === filteredGroups.length && filteredGroups.length > 0}
                                        className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                                    />
                                </th>
                                {['#', 'Group Name', 'Total Contacts', 'Actions'].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Loading groups...</td></tr>
                            ) : filteredGroups.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500">No contact groups found.</td></tr>
                            ) : (
                                filteredGroups.map((group, index) => (
                                    <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-100">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input type="checkbox"
                                                onChange={() => handleRowSelect(group.id)}
                                                checked={selectedRows.includes(group.id)}
                                                className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{group.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                                                {group.totalContacts || 0} Contacts
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3">
                                            <button onClick={() => handleOpenModal(group)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteGroup(group.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
                        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditMode ? 'Edit Contact Group' : 'Create New Group'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveGroup} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Name *</label>
                                <input
                                    type="text"
                                    value={currentGroup.name}
                                    onChange={(e) => setCurrentGroup({ ...currentGroup, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g., VIP Customers"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={currentGroup.description}
                                    onChange={(e) => setCurrentGroup({ ...currentGroup, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Optional description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Contacts</label>
                                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                    <div className="p-2 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                        <input
                                            type="text"
                                            placeholder="Search contacts to add..."
                                            value={contactSearchTerm}
                                            onChange={(e) => setContactSearchTerm(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-500 dark:text-white"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto p-2 space-y-1 bg-white dark:bg-gray-800">
                                        {modalFilteredContacts.length === 0 ? (
                                            <p className="text-center text-gray-500 text-sm py-2">No contacts found.</p>
                                        ) : (
                                            modalFilteredContacts.map(contact => (
                                                <div
                                                    key={contact.id}
                                                    onClick={() => toggleContactSelection(contact.id)}
                                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${currentGroup.contacts.includes(contact.id) ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                            {contact.name ? contact.name[0] : (contact.firstName ? contact.firstName[0] : '#')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                                                {contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{contact.phone || contact.number || contact.phoneNumber}</p>
                                                        </div>
                                                    </div>
                                                    {currentGroup.contacts.includes(contact.id) && (
                                                        <CheckCircleIcon className="w-5 h-5 text-indigo-600" />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 text-xs text-gray-500 text-right">
                                        {currentGroup.contacts.length} contacts selected
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : (isEditMode ? 'Update Group' : 'Create Group')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition z-20">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default ContactGroupsPage;