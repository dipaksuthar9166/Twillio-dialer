import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/20/solid';
import { DocumentTextIcon, ClockIcon, PencilSquareIcon, TagIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ChatBubbleBottomCenterTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import StatsCard from '../components/StatsCard'; // Assuming StatsCard handles the required props

const API_BASE_URL = 'http://localhost:3001/api';
const DUMMY_USER_TOKEN = '1';
const MAX_CHARS = 350;
const DUMMY_TAGS = ['{Name}', '{Address}', '{Zip}', '{State}', '{City}'];
const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar


// --- Sub-Component: Add/Edit Template Modal ---
const AddTemplateModal = ({ isOpen, onClose, onSave, templateToEdit }) => {
    // Determine mode and set initial state based on 'templateToEdit' prop
    const isEditMode = !!templateToEdit;
    const [name, setName] = useState(templateToEdit?.name || '');
    const [content, setContent] = useState(templateToEdit?.content || '');
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when the modal opens/closes or when 'templateToEdit' changes
    useEffect(() => {
        if (isOpen) {
            setName(templateToEdit?.name || '');
            setContent(templateToEdit?.content || '');
        }
    }, [isOpen, templateToEdit]);

    const handleTagClick = (tag) => {
        setContent(prev => prev + tag);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !content.trim()) {
            alert("Template Name and Content are required.");
            return;
        }

        setIsSaving(true);
        const data = {
            // Pass ID if it's an existing template
            id: templateToEdit?.id,
            name,
            content,
            tags: DUMMY_TAGS
        };
        // Parent's onSave handles the logic for POST vs PUT
        await onSave(data);
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform scale-100 transition-transform duration-300">

                {/* Modal Header: Changes based on mode */}
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {isEditMode ? 'Edit Template' : 'Add Message Template'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body: Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Template Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter template name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>

                    {/* Available Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Tags</label>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {DUMMY_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagClick(tag)}
                                    className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Text *</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter template content"
                            maxLength={MAX_CHARS}
                            rows="6"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                        <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                            {content.length}/{MAX_CHARS} characters
                        </p>
                    </div>

                    {/* Modal Footer: Buttons: Changes text and icon based on mode */}
                    <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            disabled={isSaving}
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center disabled:bg-purple-400"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                            ) : isEditMode ? (
                                <PencilSquareIcon className="w-5 h-5 mr-2" />
                            ) : (
                                <PlusIcon className="w-5 h-5 mr-2" />
                            )}
                            {isSaving ? 'Saving...' : isEditMode ? 'Update Template' : 'Add Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --------------------------------------------------------------------------------------------------
// --- Main Component ---
// --------------------------------------------------------------------------------------------------
const MessageTemplates = () => {
    // --- State Management ---
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [perPage, setPerPage] = useState('10');
    const [selectedRows, setSelectedRows] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState(null);

    // Dummy Stats
    const stats = {
        totalTemplates: templates.length,
        recentTemplates: 0,
        avgLength: 0,
        availableTags: 5,
    };

    // --- Fetch Logic ---
    const fetchTemplatesData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const statsPromise = axios.get(`${API_BASE_URL}/templates/stats`);
            const listPromise = axios.get(`${API_BASE_URL}/templates/all`);

            const [statsRes, listRes] = await Promise.all([statsPromise, listPromise]);

            // Stats update logic...
            if (statsRes.data.success) {
                stats.totalTemplates = statsRes.data.totalTemplates;
                stats.recentTemplates = statsRes.data.recentTemplates;
                stats.avgLength = statsRes.data.avgLength;
                stats.availableTags = statsRes.data.availableTags;
            }

            if (listRes.data.success) {
                const dataWithIds = listRes.data.templates.map(t => ({
                    ...t,
                    id: t.id || Math.random().toString(36).substring(2, 9)
                }));
                setTemplates(dataWithIds);
            }

        } catch (err) {
            console.error("Template Data Fetch Error:", err);
            setError("Failed to load templates. Check backend connection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplatesData();
    }, []);

    // --------------------------------------------------------------------------------------------------
    // --- RESTORED ACTION HANDLERS ---
    // --------------------------------------------------------------------------------------------------

    // RESTORED: Handles input change for search bar
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // RESTORED: Handles checkbox selection for table rows
    const handleRowSelect = (id) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    // Handler for the "Add Template" button
    const handleAddTemplate = () => {
        setTemplateToEdit(null); // Clear any edit data (sets mode to Add)
        setIsModalOpen(true);
    };

    // Handler for the "Edit" button in the table
    const handleEditTemplate = (template) => {
        setTemplateToEdit(template); // Load the template data into the state
        setIsModalOpen(true); // Open the modal
    };

    // Unified Save Handler (Handles both Add and Update)
    const handleSaveTemplate = async (formData) => {
        const isEditMode = !!formData.id;

        try {
            if (isEditMode) {
                // API call for UPDATE (PUT request)
                const url = `${API_BASE_URL}/templates/${formData.id}`;
                const response = await axios.put(url, formData);

                if (response.status === 200) {
                    alert(`Template '${formData.name}' updated successfully.`);
                }
            } else {
                // API call for CREATE (POST request)
                const url = `${API_BASE_URL}/templates/new`;
                const response = await axios.post(url, formData);

                if (response.status === 201) {
                    alert(`Template '${formData.name}' created successfully.`);
                }
            }

            // Close modal and refresh data after successful operation
            setIsModalOpen(false);
            setTemplateToEdit(null);
            fetchTemplatesData();

        } catch (err) {
            alert(`${isEditMode ? 'Update' : 'Creation'} failed: ${err.response?.data?.message || 'Server error'}`);
        }
    };

    // Bulk Delete Handler
    const handleDeleteSelected = async () => {
        if (selectedRows.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedRows.length} templates?`)) {
            setIsLoading(true);
            try {
                // API call to delete templates
                await axios.post(`${API_BASE_URL}/templates/delete`, { ids: selectedRows });

                alert("Deletion successful.");
                setSelectedRows([]);
                fetchTemplatesData(); // Refresh list
            } catch (err) {
                setError("Deletion failed.");
                setIsLoading(false);
            }
        }
    };

    // Single Delete Handler
    const handleDeleteTemplate = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete the template: "${name}"?`)) {
            setIsLoading(true);
            try {
                await axios.delete(`${API_BASE_URL}/templates/${id}`);
                alert("Deletion successful.");
                fetchTemplatesData();
            } catch (err) {
                setError("Deletion failed.");
                setIsLoading(false);
            }
        }
    };


    // --- Filtering the list based on search term ---
    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Applying perPage limit for display (client-side pagination simplification)
    const displayTemplates = filteredTemplates.slice(0, parseInt(perPage));


    // --- JSX (Matching Image Design) ---
    return (
        // 🟢 FIX: Added height, overflow, and position compensation for fixed Navbar
        <div
            className="p-8 bg-gray-50 dark:bg-gray-900 flex-grow overflow-y-auto"
            style={{
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, // 66px (Navbar) + 32px (p-8)
                marginTop: `-${NAVBAR_HEIGHT_PX}px` // Pull up under the navbar
            }}
        >
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">SMS Template Management</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Create and manage reusable SMS templates for your campaigns.</p>
            </header>

            {/* --- 1. Stats Cards (4 Columns) --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* TOTAL TEMPLATES */}
                <StatsCard title="TOTAL TEMPLATES" value={isLoading ? '...' : stats.totalTemplates} subtitle="All templates created" change="N/A" icon={<DocumentTextIcon className="w-5 h-5 text-purple-500" />} color="bg-purple-50" borderColor="bg-purple-500" changeColor="text-purple-500" timeRangeLabel="Status" isLoading={isLoading} />

                {/* RECENT TEMPLATES */}
                <StatsCard title="RECENT TEMPLATES" value={isLoading ? '...' : stats.recentTemplates} subtitle="Created this week" change="N/A" icon={<ClockIcon className="w-5 h-5 text-green-500" />} color="bg-green-50" borderColor="bg-green-500" changeColor="text-green-500" timeRangeLabel="Status" isLoading={isLoading} />

                {/* AVG LENGTH */}
                <StatsCard title="AVG LENGTH" value={isLoading ? '...' : stats.avgLength} subtitle="Characters per template" change="N/A" icon={<PencilSquareIcon className="w-5 h-5 text-orange-500" />} color="bg-orange-50" borderColor="bg-orange-500" changeColor="text-orange-500" timeRangeLabel="Status" isLoading={isLoading} />

                {/* AVAILABLE TAGS */}
                <StatsCard title="AVAILABLE TAGS" value={isLoading ? '...' : stats.availableTags} subtitle="Dynamic placeholders" change="N/A" icon={<TagIcon className="w-5 h-5 text-pink-500" />} color="bg-pink-50" borderColor="bg-pink-500" changeColor="text-pink-500" timeRangeLabel="Status" isLoading={isLoading} />
            </div>

            {/* --- 2. Search and Actions Bar --- */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700 flex justify-between items-end">

                {/* Search Templates (Wider Input) */}
                <div className="w-full max-w-lg mr-6">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Search Templates</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by name or content..."
                            value={searchTerm}
                            // FIX: handleSearchChange is now correctly defined
                            onChange={handleSearchChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:border-gray-600"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Per Page Selector */}
                <div className="w-24 mr-6 flex-shrink-0">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Per Page</label>
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={isLoading}
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>

                {/* Delete Selected Action Button (Red) */}
                <button
                    onClick={handleDeleteSelected}
                    className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-150 flex items-center gap-2 font-semibold ${selectedRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={selectedRows.length === 0 || isLoading}
                >
                    <TrashIcon className="w-5 h-5" /> Delete Selected
                </button>

                {/* Add New Template Button (Purple/Indigo) */}
                <button
                    onClick={handleAddTemplate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-150 flex items-center gap-2 font-semibold shadow-md"
                    disabled={isLoading}
                >
                    <PlusIcon className="w-5 h-5" /> Add Template
                </button>
            </div>

            {/* --- 3. Template Library Table --- */}
            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 p-6 border-b dark:border-gray-700">Template Library</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {/* Select All Checkbox */}
                                <th className="px-6 py-3 text-left w-10">
                                    <input type="checkbox"
                                        onChange={() => setSelectedRows(displayTemplates.length === selectedRows.length ? [] : displayTemplates.map(c => c.id))}
                                        checked={displayTemplates.length > 0 && selectedRows.length === displayTemplates.length}
                                        className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                                    />
                                </th>
                                {/* Table Headers... */}
                                {['Template Name', 'Content Preview', 'Created Date', 'Actions'].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 dark:text-gray-400">Loading template data...</td></tr>
                            ) : displayTemplates.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500 dark:text-gray-400">No templates found</td></tr>
                            ) : (
                                displayTemplates.map((template) => (
                                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-100">
                                        {/* Row Checkbox */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input type="checkbox"
                                                // FIX: handleRowSelect is now correctly defined
                                                onChange={() => handleRowSelect(template.id)}
                                                checked={selectedRows.includes(template.id)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        {/* Data Cells */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{template.content}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{template.created}</td>

                                        {/* Actions Cell */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                                onClick={() => handleEditTemplate(template)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id, template.name)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-3 font-medium"
                                            >
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

            {/* Floating Chat Button... */}
            <button className="fixed bottom-8 right-8 bg-purple-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition">
                <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            </button>

            {/* Template Creation Modal (Passes templateToEdit for pre-filling) */}
            <AddTemplateModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setTemplateToEdit(null); // Clear edit state on close
                }}
                onSave={handleSaveTemplate}
                templateToEdit={templateToEdit} // Pass the data here
            />
        </div>
    );
};

export default MessageTemplates;