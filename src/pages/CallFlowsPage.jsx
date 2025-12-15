import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/20/solid';
import { PhoneIcon, Cog6ToothIcon, UserGroupIcon, ChartBarSquareIcon, ArrowPathIcon, StopIcon, ClockIcon, UsersIcon, MegaphoneIcon, ListBulletIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import { ArrowUpIcon, MagnifyingGlassIcon, XMarkIcon, ChatBubbleLeftRightIcon, PencilSquareIcon, TrashIcon, ChevronLeftIcon, DocumentDuplicateIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
// import FlowCreationPage from './FlowCreationPage'; // No longer needed


const API_BASE_URL = 'http://localhost:3001/api/call-flows';

const DUMMY_USER_TOKEN = 'SUPER_ADMIN_TOKEN';
const NAVBAR_HEIGHT_PX = 75;

// --- Scrollbar CSS Helpers: nice thin scroll on inner content, optional fully hidden rails ---
const SCROLLBAR_HIDE_STYLES = `
  /* Main content vertical scroll (list + editor wrapper) */
  .callflowspage-content-scroll {
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb #fff;
  }
  .callflowspage-content-scroll::-webkit-scrollbar {
    width: 5px;
    background: #fff;
  }
  .callflowspage-content-scroll::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 8px;
  }

  /* Completely hide rails for inner editor columns */
  .scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
/*
  Usage example:
    <div className="callflowspage-content-scroll overflow-auto h-full">
      ... main content here ...
    </div>
  Place this scrollable class only on the main content area, not on the sidebar or parent container,
  to ensure only the content scrolls and the sidebar remains fixed.
*/


// --- Main Component ---
const CallFlowsPage = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = SCROLLBAR_HIDE_STYLES;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // --- State Management ---
    const [view, setView] = useState('list');
    const [selectedFlow, setSelectedFlow] = useState(null);
    const [flows, setFlows] = useState([]);
    const [stats, setStats] = useState({ totalFlows: 0, configured: 0, activeNumbers: 0, performance: '0%' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [perPage, setPerPage] = useState('10');
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    // --- UI State for Modals & Toasts ---
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [flowToDelete, setFlowToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // type: 'success' | 'error'

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // --- Fetch Logic: Connects to the Node.js Backend ---
    const fetchFlowData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/all`, {
                headers: { 'Authorization': `Bearer ${DUMMY_USER_TOKEN}` }
            });

            if (response.data.success) {
                // Backend returns 'flows' (and 'stats')
                const rawFlows = response.data.flows || response.data.callFlows || [];
                // Ensure 'id' property exists for frontend compatibility
                const callFlows = (rawFlows || []).filter(f => f).map(f => ({ ...f, id: f._id || f.id }));
                setFlows(callFlows);

                // Use backend stats if available, otherwise calculate locally
                if (response.data.stats) {
                    setStats(response.data.stats);
                } else {
                    const totalFlows = callFlows.length;
                    const configured = callFlows.filter(f => f.flowConfiguration && (f.flowConfiguration.nodes?.length > 0 || f.flowConfiguration.edges?.length > 0)).length;
                    const activeNumbers = callFlows.filter(f => f.phoneNumbers && f.phoneNumbers.length > 0).length;
                    const totalSuccessRate = callFlows.reduce((sum, flow) => sum + (flow.successRate || 0), 0);
                    const performance = totalFlows > 0 ? `${Math.round((totalSuccessRate / totalFlows) * 100)}%` : '0%';

                    setStats({
                        totalFlows,
                        configured,
                        activeNumbers,
                        performance
                    });
                }
            } else {
                setError(response.data.message || 'Failed to fetch flow data.');
                setFlows([]);
            }
        } catch (err) {
            console.error("Error fetching flow data:", err);
            const msg = err.response?.data?.message || err.message || 'Failed to load data.';
            setError(`${msg} (Ensure Node.js server is running on port 3001)`);
            setFlows([]);
            setStats({ totalFlows: 0, configured: 0, activeNumbers: 0, performance: '0%' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchFlowData();
        }
    }, [view]);

    // --- Action Handlers ---
    const handleNewFlow = () => {
        setCreateModalOpen(true);
    };

    const handleSaveNewFlow = async (formData) => {
        // Reset any previous error
        setError(null);
        try {
            // Show loading indicator by switching view to list and setting isLoading
            setIsLoading(true);
            // POST new flow to backend
            const response = await axios.post(`${API_BASE_URL}`, {
                name: formData.flowName,
                // Add any additional default fields if required by backend
            }, {
                headers: { 'Authorization': `Bearer ${DUMMY_USER_TOKEN}` }
            });
            if (response.data && response.data.success) {
                // Successfully created
                setCreateModalOpen(false);
                // Refresh the list of flows
                await fetchFlowData();
                showToast(`Flow "${formData.flowName}" created successfully!`, 'success');
            } else {
                // Backend returned an error
                const msg = response.data?.message || 'Failed to create flow.';
                setError(msg);
                showToast(msg, 'error');
            }
        } catch (err) {
            console.error('Error creating flow:', err);
            const msg = err.response?.data?.message || err.message || 'Error creating flow.';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditFlow = (flow) => {
        setSelectedFlow(flow);
        setView('edit');
    };

    const handleCloseEditor = () => {
        setSelectedFlow(null);
        setView('list');
    };

    const handleDeleteFlow = (flow) => {
        setFlowToDelete(flow);
        setDeleteModalOpen(true);
    };

    const confirmDeleteFlow = async () => {
        if (!flowToDelete) return;

        try {
            await axios.delete(`${API_BASE_URL}/${flowToDelete.id}`, {
                headers: { 'Authorization': `Bearer ${DUMMY_USER_TOKEN}` }
            });
            // The UI will be updated via the socket event, so no need to manually update state here.
            // However, since we might not have socket setup fully working for delete yet in this file, let's refresh manually or filter locally
            setFlows(prev => prev.filter(f => f.id !== flowToDelete.id));
            showToast(`Flow "${flowToDelete.name}" deleted successfully.`, 'success');
        } catch (err) {
            console.error("Error deleting flow:", err);
            showToast(`Failed to delete flow '${flowToDelete.name}'.`, 'error');
        } finally {
            setDeleteModalOpen(false);
            setFlowToDelete(null);
        }
    };

    const handleSortClick = (key) => {
        const normalizedKey = key.replace(/\s/g, '').toLowerCase();
        if (sortBy === normalizedKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(normalizedKey);
            setSortDirection('asc');
        }
    };

    // --- Filtering and Sorting Logic (Client-Side) ---
    // 🟢 FIX: Ensure flows is always an array before filtering
    const filteredAndSortedFlows = (flows || [])
        .filter(flow => {
            const normalizedTerm = searchTerm.toLowerCase();
            return (
                flow.name.toLowerCase().includes(normalizedTerm) ||
                (flow.phoneNumbers || []).some(p => p.toLowerCase().includes(normalizedTerm))
            );
        })
        .sort((a, b) => {
            const key = sortBy === 'phoneNumbers' ? 'phoneNumbers' : 'name';
            const fieldA = Array.isArray(a[key]) ? a[key][0] || '' : (a[key] || '');
            const fieldB = Array.isArray(b[key]) ? b[key][0] || '' : (b[key] || '');

            if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
            if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        })
        .slice(0, parseInt(perPage));


    // --- View Rendering Logic ---
    // if (view === 'create') { ... } // Removed full page view

    if (view === 'edit' && selectedFlow) {
        return (
            <FlowEditorView
                flow={selectedFlow}
                onClose={handleCloseEditor}
            />
        );
    }

    // Default View: List and Stats (separate scroll from sidebar/navbar)
    return (
        <div
            className="bg-gray-50 px-6 md:px-10"
            style={{
                minHeight: '100vh',
                height: '100vh',
                paddingTop: `${NAVBAR_HEIGHT_PX + 24}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`,
                overflow: 'hidden', // lock body scroll; only inner panel scrolls
            }}
        >
            <div
                className="mx-auto flex max-w-6xl"
                style={{ height: `calc(100vh - ${NAVBAR_HEIGHT_PX + 48}px)` }}
            >
                <div className="callflowspage-content-scroll w-full space-y-8 overflow-y-auto pb-14 pt-10">
                    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-indigo-600 tracking-wide uppercase">Call flows</p>
                            <h1 className="text-3xl font-bold text-gray-900">Call Flows Management</h1>
                            <p className="text-gray-500 mt-1">
                                Create and manage call flows with drag-and-drop interface and advanced routing options.
                            </p>
                        </div>
                        <button
                            onClick={handleNewFlow}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition disabled:opacity-60"
                        >
                            <PlusIcon className="h-5 w-5" />
                            New Flow
                        </button>
                    </header>

                    {error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                            <XMarkIcon className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Unable to load call flows</p>
                                <p className="text-sm">{error}</p>
                            </div>
                            <button
                                onClick={fetchFlowData}
                                className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-800"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    )}

                    <StatsSummary stats={stats} isLoading={isLoading} />

                    <div className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Search flows</label>
                                <div className="relative mt-2">
                                    <input
                                        type="text"
                                        placeholder="Search by name or phone"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm transition focus:border-indigo-400 focus:bg-white focus:outline-none"
                                    />
                                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Per page</label>
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
                                >
                                    {[10, 25, 50].map((value) => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sort by</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none"
                                >
                                    <option value="name">Name</option>
                                    <option value="phoneNumbers">Phone Numbers</option>
                                    <option value="status">Status</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sort order</label>
                                <button
                                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                    className="mt-2 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300"
                                >
                                    {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                                    <ArrowUpIcon className={`h-4 w-4 text-gray-500 transition ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div>
                                <p className="text-lg font-semibold text-gray-900">Call Flows Directory</p>
                                <p className="text-sm text-gray-500">Showing {filteredAndSortedFlows.length} of {(flows || []).length} flows</p>
                            </div>
                            <button className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                Export
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        {['Name', 'Phone Numbers', 'Call Flow', 'Actions'].map((header) => (
                                            <th key={header} className="px-6 py-3">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">Loading call flows...</td>
                                        </tr>
                                    ) : filteredAndSortedFlows.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-16 text-center text-gray-500">
                                                No call flows match your search.
                                                <div className="mt-4">
                                                    <button
                                                        onClick={handleNewFlow}
                                                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
                                                    >
                                                        <PlusIcon className="h-4 w-4" /> Create call flow
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAndSortedFlows.map((flow) => {
                                            const phoneNumbers = flow.phoneNumbers?.length ? flow.phoneNumbers.join(', ') : 'No numbers assigned';
                                            const applets = flow.appletsCount || flow.steps?.length || 2;
                                            return (
                                                <tr key={flow.id} className="hover:bg-gray-50/80">
                                                    <td className="px-6 py-5">
                                                        <p className="font-semibold text-gray-900">{flow.name}</p>
                                                        <p className="text-xs text-gray-500">Updated {flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString() : 'recently'}</p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-gray-700">{phoneNumbers}</p>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                                                            Call Flow with {applets} applets
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={() => handleEditFlow(flow)}
                                                                className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                                                            >
                                                                <PencilSquareIcon className="h-4 w-4" /> Edit Flow
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteFlow(flow)}
                                                                className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-200"
                                                            >
                                                                <TrashIcon className="h-4 w-4" /> Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <footer className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
                            <p>Showing 1 to {filteredAndSortedFlows.length || 1} of {flows.length} entries</p>
                            <div className="flex items-center gap-2">
                                <button className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50" disabled>&laquo;</button>
                                <button className="rounded-full border border-indigo-500 bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">1</button>
                                <button className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50" disabled>&raquo;</button>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            <button className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-2xl hover:shadow-lg">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </button>

            {/* Modals & Toasts */}
            <CreateFlowModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleSaveNewFlow}
                isLoading={isLoading}
            />

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteFlow}
                itemName={flowToDelete?.name}
            />

            <ToastNotification
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};

export default CallFlowsPage;

// --- Helper Components ---

const CreateFlowModal = ({ isOpen, onClose, onSave, isLoading }) => {
    const [flowName, setFlowName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!flowName.trim()) return;
        onSave({ flowName });
        setFlowName(''); // Reset after submit
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Call Flow</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div>
                        <label htmlFor="flowName" className="block text-sm font-medium text-gray-700">
                            Flow Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="flowName"
                            className="mt-2 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                            placeholder="e.g., Sales Hotline, Support IVR"
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
                            disabled={isLoading || !flowName.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Flow'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                        <TrashIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Call Flow</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">"{itemName}"</span>? This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        onClick={onConfirm}
                    >
                        Delete Flow
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToastNotification = ({ show, message, type, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed top-24 right-8 z-50 flex w-full max-w-sm transform items-center gap-3 rounded-xl bg-white p-4 shadow-2xl transition-all animate-in slide-in-from-right duration-300 border border-gray-100">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {type === 'success' ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <XMarkIcon className="h-6 w-6" />
                )}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{type === 'success' ? 'Success' : 'Error'}</p>
                <p className="text-sm text-gray-500">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

import StatsCard from '../components/StatsCard';

const StatsSummary = ({ stats, isLoading }) => {
    const config = [
        {
            title: 'Total Flows',
            value: stats.totalFlows,
            subtitle: 'Active call flows',
            icon: <PhoneIcon className="w-6 h-6 text-pink-600" />,
            color: 'bg-pink-100',
            borderColor: 'bg-pink-500'
        },
        {
            title: 'Configured',
            value: stats.configured,
            subtitle: 'With call structure',
            icon: <Cog6ToothIcon className="w-6 h-6 text-green-600" />,
            color: 'bg-green-100',
            borderColor: 'bg-green-500'
        },
        {
            title: 'Active Numbers',
            value: stats.activeNumbers,
            subtitle: 'With phone numbers',
            icon: <UserGroupIcon className="w-6 h-6 text-orange-600" />,
            color: 'bg-orange-100',
            borderColor: 'bg-orange-500'
        },
        {
            title: 'Performance',
            value: stats.performance,
            subtitle: 'Success rate',
            icon: <ChartBarSquareIcon className="w-6 h-6 text-purple-600" />,
            color: 'bg-purple-100',
            borderColor: 'bg-purple-500'
        },
    ];

    return (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {config.map((stat, index) => (
                <StatsCard key={index} {...stat} isLoading={isLoading} />
            ))}
        </div>
    );
};



// --- Editor Helper Components & Data ---

const APPLETS = [
    // Voice / TwiML
    { id: 'gather_input', label: 'Gather Input', icon: ChatBubbleBottomCenterTextIcon, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Capture keypress or speech', category: 'Voice' },
    { id: 'dial', label: 'Connect Call', icon: PhoneIcon, color: 'text-green-600', bg: 'bg-green-50', desc: 'Dial a number or SIP', category: 'Voice' },
    { id: 'say_play', label: 'Say / Play', icon: MegaphoneIcon, color: 'text-yellow-600', bg: 'bg-yellow-50', desc: 'TTS or Audio file', category: 'Voice' },
    { id: 'record', label: 'Record', icon: StopIcon, color: 'text-red-600', bg: 'bg-red-50', desc: 'Record audio', category: 'Voice' },
    { id: 'voicemail', label: 'Voicemail', icon: ChatBubbleBottomCenterTextIcon, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Pre-built voicemail', category: 'Voice' },
    { id: 'auto_call', label: 'Auto Call', icon: PhoneIcon, color: 'text-cyan-600', bg: 'bg-cyan-50', desc: 'Trigger automated call', category: 'Voice' },

    // Flow Logic
    { id: 'split', label: 'Split Based On...', icon: ArrowPathIcon, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Branching logic', category: 'Logic' },
    { id: 'wait', label: 'Wait', icon: ClockIcon, color: 'text-gray-600', bg: 'bg-gray-50', desc: 'Pause execution', category: 'Logic' },

    // Tools
    { id: 'http_request', label: 'HTTP Request', icon: ChartBarSquareIcon, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Call external API', category: 'Tools' },
    { id: 'function', label: 'Run Function', icon: Cog6ToothIcon, color: 'text-pink-600', bg: 'bg-pink-50', desc: 'Execute serverless code', category: 'Tools' },
    { id: 'sms', label: 'Send Message', icon: ChatBubbleLeftRightIcon, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Send SMS/MMS', category: 'Messaging' },
    { id: 'auto_message', label: 'Auto Message', icon: ChatBubbleLeftRightIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Automated SMS reply', category: 'Messaging' },
    { id: 'bulk_message', label: 'Bulk Message', icon: UserGroupIcon, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Send to contact group', category: 'Messaging' },
];

const FlowEditorView = ({ flow, onClose }) => {
    // Initialize nodes from flow configuration or start empty
    const [nodes, setNodes] = useState(flow.flowConfiguration?.nodes || []);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Save logic
    const handleSave = () => {
        // In a real app, you'd save 'nodes' back to the backend here
        // For now we just alert
        console.log("Saving Flow Nodes:", nodes);
        alert(`Flow "${flow.name}" saved with ${nodes.length} applets!`);
        onClose();
    };

    // Drag & Drop Handlers
    const handleDragStart = (e, appletType) => {
        e.dataTransfer.setData('appletType', appletType);
        setIsDragging(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Allow dropping
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const appletType = e.dataTransfer.getData('appletType');
        if (!appletType) return;

        const appletDef = APPLETS.find(a => a.id === appletType);
        const newNode = {
            id: Date.now().toString(), // Simple ID generation
            type: appletType,
            label: appletDef.label,
            data: {} // Initial empty data
        };

        setNodes((prev) => [...prev, newNode]);
        setSelectedNodeId(newNode.id); // Auto-select new node
    };

    const handleDeleteNode = (nodeId) => {
        setNodes((prev) => prev.filter(n => n.id !== nodeId));
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
    };

    const handleUpdateNodeData = (nodeId, newData) => {
        setNodes((prev) => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    // Group applets by category
    const appletsByCategory = APPLETS.reduce((acc, applet) => {
        if (!acc[applet.category]) acc[applet.category] = [];
        acc[applet.category].push(applet);
        return acc;
    }, {});

    return (
        <div className="flex flex-col h-full bg-gray-50" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT_PX}px)` }}>
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">Studio Flow</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{flow.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSave} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                        Publish Changes
                    </button>
                </div>
            </header>

            {/* Main Editor Area */}
            <div className="flex-1 overflow-hidden flex">

                {/* LEFT: Canvas / Drop Zone */}
                <div
                    className="flex-1 bg-slate-50 p-8 overflow-y-auto relative transition-colors duration-200"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="max-w-xl mx-auto space-y-8 pb-32">
                        {/* Start Node (Trigger) */}
                        <div className="flex flex-col items-center">
                            <div className="w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-4 text-center relative text-white">
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    Trigger
                                </span>
                                <p className="font-semibold">Incoming Call</p>
                                <p className="text-slate-400 text-xs mt-1">REST API / Subflow</p>
                            </div>
                            <div className="h-8 w-0.5 bg-slate-300"></div>
                        </div>

                        {/* Dropped Nodes List */}
                        {nodes.length === 0 && (
                            <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white/50'}`}>
                                <p className="text-slate-500 font-medium text-lg">Start building your flow</p>
                                <p className="text-slate-400 text-sm mt-1">Drag widgets from the library on the right</p>
                            </div>
                        )}

                        {nodes.map((node, index) => {
                            const appletDef = APPLETS.find(a => a.id === node.type);
                            const isSelected = selectedNodeId === node.id;
                            const Icon = appletDef?.icon || Cog6ToothIcon;

                            return (
                                <div key={node.id} className="flex flex-col items-center group relative">
                                    <div
                                        onClick={() => setSelectedNodeId(node.id)}
                                        className={`w-80 relative cursor-pointer transition-all duration-200 transform hover:-translate-y-1
                                            ${isSelected ? 'ring-2 ring-indigo-500 shadow-xl scale-105' : 'hover:shadow-lg shadow-sm'}
                                        `}
                                    >
                                        <div className={`bg-white rounded-lg border p-4 flex items-start gap-4 ${isSelected ? 'border-indigo-500' : 'border-gray-200'}`}>
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${appletDef?.bg} ${appletDef?.color}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-gray-900 truncate">{node.data.customLabel || node.label}</h4>
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase">{appletDef?.category}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{node.data.message || node.data.prompt || appletDef?.desc}</p>
                                            </div>
                                        </div>

                                        {/* Delete Button (Absolute) */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                                            className="absolute -right-3 -top-3 bg-white border border-gray-200 p-1.5 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                                            title="Remove Widget"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {/* Connector Line (if not last) */}
                                    {index < nodes.length - 1 && <div className="h-8 w-0.5 bg-slate-300"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MIDDLE: Config Panel (Dynamic Form) */}
                {selectedNode ? (
                    <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20">
                        <div className="p-5 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-3 mb-1">
                                {(() => {
                                    const def = APPLETS.find(a => a.id === selectedNode.type);
                                    const Icon = def?.icon || Cog6ToothIcon;
                                    return <Icon className={`h-5 w-5 ${def?.color}`} />;
                                })()}
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Configuration</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{selectedNode.label}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <ConfigForm
                                node={selectedNode}
                                onChange={(newData) => handleUpdateNodeData(selectedNode.id, newData)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-96 bg-white border-l border-gray-200 flex flex-col items-center justify-center text-center p-8 text-gray-400 bg-gray-50/50">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Cog6ToothIcon className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-medium">No Widget Selected</h3>
                        <p className="text-sm mt-2 max-w-[200px]">Click on a widget in the canvas to configure its properties.</p>
                    </div>
                )}

                {/* RIGHT: Toolbox */}
                <div className="w-72 bg-white border-l border-gray-200 flex flex-col z-10 shadow-xl">
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Widget Library</h3>
                        <p className="text-xs text-gray-500 mt-1">Drag & drop to build your flow</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {Object.entries(appletsByCategory).map(([category, applets]) => (
                            <div key={category}>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 ml-1">{category}</h4>
                                <div className="space-y-2">
                                    {applets.map((applet) => (
                                        <div
                                            key={applet.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, applet.id)}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                                        >
                                            <div className={`h-8 w-8 rounded flex items-center justify-center ${applet.bg} ${applet.color} group-hover:scale-110 transition-transform`}>
                                                <applet.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">{applet.label}</p>
                                                <p className="text-[10px] text-gray-400">{applet.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
// --- Success Modal Component ---
const SuccessModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <CheckCircleIcon className="h-10 w-10 text-green-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        {message}
                    </p>
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                        onClick={onClose}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Dynamic Configuration Form Component ---
const ConfigForm = ({ node, onChange }) => {
    const [contactGroups, setContactGroups] = useState([]);
    const [senderNumbers, setSenderNumbers] = useState([]); // 🟢 ADD: State for sender numbers
    const [isSending, setIsSending] = useState(false);

    // Modal State
    const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        if (node.type === 'bulk_message') {
            fetchContactGroups();
            fetchSenderNumbers(); // 🟢 ADD: Fetch sender numbers
        }
    }, [node.type]);

    const fetchContactGroups = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL.replace('/call-flows', '')}/contact-groups/all`);
            if (response.data.success) {
                setContactGroups(response.data.groups);
            }
        } catch (error) {
            console.error("Failed to fetch contact groups:", error);
        }
    };

    // 🟢 ADD: Fetch Sender Numbers
    const fetchSenderNumbers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL.replace('/call-flows', '')}/from-numbers`);
            if (Array.isArray(response.data)) {
                setSenderNumbers(response.data);
                // Auto-select first number if not set
                if (!node.data.senderNumber && response.data.length > 0) {
                    handleChange('senderNumber', response.data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch sender numbers:", error);
        }
    };

    const handleChange = (field, value) => {
        onChange({ [field]: value });
    };

    const handleSendBulkMessage = async () => {
        const { group, message, schedule, scheduleDate, scheduleTime, senderNumber } = node.data;

        if (!group || !message) {
            alert("Please select a contact group and enter a message.");
            return;
        }

        // 🟢 FIX: Validate sender number
        if (!senderNumber) {
            alert("Please select a Sender Number.");
            return;
        }

        setIsSending(true);
        try {
            const selectedGroup = contactGroups.find(g => g.id === group);
            const groupName = selectedGroup ? selectedGroup.name : '';

            let payload = {
                campaignTitle: node.data.customLabel || "Bulk Message Flow",
                messageContent: message,
                senderNumber: senderNumber, // 🟢 FIX: Use selected sender number
            };

            let endpoint = '';

            if (schedule === 'scheduled') {
                if (!scheduleDate || !scheduleTime) {
                    alert("Please select a date and time for the scheduled campaign.");
                    setIsSending(false);
                    return;
                }
                endpoint = `${API_BASE_URL.replace('/call-flows', '')}/bulk/schedule`;
                payload = {
                    ...payload,
                    contactGroup: groupName, // Schedule endpoint expects name
                    contactGroupId: group,   // 🟢 FIX: Schedule endpoint also needs ID for CampaignModel
                    dateTime: `${scheduleDate}T${scheduleTime}`,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                };
            } else {
                endpoint = `${API_BASE_URL.replace('/call-flows', '')}/bulk/send-now`;
                payload = {
                    ...payload,
                    contactGroupId: group, // Send-now endpoint expects ID
                };
            }

            const response = await axios.post(endpoint, payload);
            if (response.data.success) {
                // alert(response.data.message);
                setModalState({
                    isOpen: true,
                    title: schedule === 'scheduled' ? 'Campaign Scheduled!' : 'Blast Sent Successfully!',
                    message: response.data.message
                });
            } else {
                alert("Failed: " + response.data.message);
            }

        } catch (error) {
            console.error("Bulk send error:", error);
            alert("Error sending message: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSending(false);
        }
    };

    const CommonFields = () => (
        <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Widget Name</label>
                <input
                    type="text"
                    value={node.data.customLabel || node.label}
                    onChange={(e) => handleChange('customLabel', e.target.value)}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
            </div>
        </div>
    );

    return (
        <>
            <SuccessModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                title={modalState.title}
                message={modalState.message}
            />
            {(() => {
                switch (node.type) {
                    case 'dial':
                    case 'connect_call':
                        return (
                            <div className="space-y-5">
                                <CommonFields />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number / SIP</label>
                                    <input
                                        type="tel"
                                        placeholder="+1234567890"
                                        value={node.data.phoneNumber || ''}
                                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Enter a phone number or SIP URI.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Caller ID</label>
                                    <select
                                        value={node.data.callerId || 'default'}
                                        onChange={(e) => handleChange('callerId', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="default">Default (Incoming Caller)</option>
                                        <option value="office">Office Number</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (seconds)</label>
                                    <input
                                        type="number"
                                        value={node.data.timeout || 30}
                                        onChange={(e) => handleChange('timeout', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="recordCall"
                                        checked={node.data.recordCall || false}
                                        onChange={(e) => handleChange('recordCall', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="recordCall" className="text-sm text-gray-700">Record this call</label>
                                </div>
                            </div>
                        );

                    case 'say_play':
                    case 'custom_whisper':
                    case 'greeting':
                        return (
                            <div className="space-y-5">
                                <CommonFields />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
                                    <div className="flex rounded-md shadow-sm" role="group">
                                        <button type="button" className="flex-1 px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-indigo-700 focus:text-indigo-700">
                                            Text to Speech
                                        </button>
                                        <button type="button" className="flex-1 px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-l-0 border-gray-200 rounded-r-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-indigo-700 focus:text-indigo-700">
                                            Audio File
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Text to Say</label>
                                    <textarea
                                        rows={4}
                                        value={node.data.message || ''}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Hello, thank you for calling..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Voice Language</label>
                                    <select
                                        value={node.data.voice || 'alice'}
                                        onChange={(e) => handleChange('voice', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="alice">Alice (US Female)</option>
                                        <option value="man">Man (US Male)</option>
                                        <option value="polly.matthew">Polly Matthew (Neural)</option>
                                        <option value="polly.joanna">Polly Joanna (Neural)</option>
                                    </select>
                                </div>
                            </div>
                        );

                    case 'gather_input':
                        return (
                            <div className="space-y-5">
                                <CommonFields />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Input Type</label>
                                    <select
                                        value={node.data.inputType || 'dtmf'}
                                        onChange={(e) => handleChange('inputType', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="dtmf">Keypress (DTMF)</option>
                                        <option value="speech">Speech Recognition</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Message</label>
                                    <textarea
                                        rows={3}
                                        value={node.data.prompt || ''}
                                        onChange={(e) => handleChange('prompt', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                        placeholder="Please press 1 for Sales..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stop Gathering On</label>
                                    <input
                                        type="text"
                                        placeholder="#"
                                        value={node.data.stopOn || '#'}
                                        onChange={(e) => handleChange('stopOn', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        );

                    case 'split':
                        return (
                            <div className="space-y-5">
                                <CommonFields />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Variable to Test</label>
                                    <select
                                        value={node.data.variable || 'trigger.call.From'}
                                        onChange={(e) => handleChange('variable', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="trigger.call.From">Caller Number</option>
                                        <option value="widgets.gather_1.Digits">Gather Result</option>
                                        <option value="flow.variables.status">Custom Variable</option>
                                    </select>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                    <p className="text-sm text-orange-800 font-medium">Transitions</p>
                                    <p className="text-xs text-orange-600 mt-1">Define your conditions to route the call to different widgets.</p>
                                    <button className="mt-3 w-full py-1.5 bg-white border border-orange-200 text-orange-700 text-xs font-bold uppercase rounded shadow-sm hover:bg-orange-50">
                                        + Add Condition
                                    </button>
                                </div>
                            </div>
                        );

                    case 'http_request':
                        return (
                            <div className="space-y-5">
                                <CommonFields />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Request URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://api.example.com/webhook"
                                        value={node.data.url || ''}
                                        onChange={(e) => handleChange('url', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                                    <select
                                        value={node.data.method || 'POST'}
                                        onChange={(e) => handleChange('method', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="GET">GET</option>
                                        <option value="POST">POST</option>
                                    </select>
                                </div>
                            </div>
                        );

                    case 'sms':
                    case 'auto_message':
                        return (
                            <div className="space-y-5">
                                <CommonFields />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                                    <textarea
                                        rows={4}
                                        value={node.data.message || ''}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Type your SMS content..."
                                    />
                                </div>
                                {node.type === 'auto_message' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reply Delay (seconds)</label>
                                        <input
                                            type="number"
                                            value={node.data.delay || 0}
                                            onChange={(e) => handleChange('delay', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        );

                    case 'bulk_message':
                        return (
                            <div className="space-y-5">
                                <CommonFields />

                                {/* 🟢 ADD: Sender Number Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sender Number</label>
                                    <select
                                        value={node.data.senderNumber || ''}
                                        onChange={(e) => handleChange('senderNumber', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="">Select a Number...</option>
                                        {senderNumbers.map((num, idx) => (
                                            <option key={idx} value={num}>{num}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">The number that will send the messages.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Contact Group</label>
                                    <select
                                        value={node.data.group || ''}
                                        onChange={(e) => handleChange('group', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="">Select a Group...</option>
                                        {contactGroups.length > 0 ? (
                                            contactGroups.map(group => (
                                                <option key={group.id} value={group.id}>{group.name} ({group.totalContacts})</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="all">All Contacts</option>
                                                <option value="leads">Leads</option>
                                                <option value="customers">Customers</option>
                                                <option value="vip">VIPs</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                                    <textarea
                                        rows={4}
                                        value={node.data.message || ''}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Type your bulk message..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduling</label>
                                    <select
                                        value={node.data.schedule || 'immediate'}
                                        onChange={(e) => handleChange('schedule', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    >
                                        <option value="immediate">Send Immediately</option>
                                        <option value="scheduled">Schedule for Later</option>
                                    </select>
                                </div>

                                {node.data.schedule === 'scheduled' && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                                            <input
                                                type="date"
                                                value={node.data.scheduleDate || ''}
                                                onChange={(e) => handleChange('scheduleDate', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 border px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time</label>
                                            <input
                                                type="time"
                                                value={node.data.scheduleTime || ''}
                                                onChange={(e) => handleChange('scheduleTime', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 border px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-gray-100 mt-2">
                                    <button
                                        onClick={handleSendBulkMessage}
                                        disabled={isSending}
                                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-white rounded-lg font-medium text-sm shadow-md transition-all active:scale-95 ${isSending ? 'bg-gray-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}
                                    >
                                        {isSending ? (
                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <UserGroupIcon className="h-4 w-4" />
                                        )}
                                        {isSending ? 'Processing...' : (node.data.schedule === 'scheduled' ? 'Schedule Campaign' : 'Send Blast Now')}
                                    </button>
                                    <p className="text-[10px] text-center text-gray-400 mt-2">
                                        This will trigger the campaign immediately or schedule it.
                                    </p>
                                </div>
                            </div>
                        );

                    case 'auto_call':
                        return (
                            <div className="space-y-5">
                                <CommonFields />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+1234567890"
                                        value={node.data.phoneNumber || ''}
                                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Announcement (TTS)</label>
                                    <textarea
                                        rows={3}
                                        value={node.data.message || ''}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm"
                                        placeholder="Message to play when answered..."
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="detectMachine"
                                        checked={node.data.detectMachine || false}
                                        onChange={(e) => handleChange('detectMachine', e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="detectMachine" className="text-sm text-gray-700">Detect Answering Machine</label>
                                </div>
                            </div>
                        );

                    default:
                        return (
                            <div className="space-y-4">
                                <CommonFields />
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500">No specific configuration available for this widget type.</p>
                                </div>
                            </div>
                        );
                }
            })()}
        </>
    );
};