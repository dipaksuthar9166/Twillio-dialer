import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    TrashIcon,
    PencilIcon,
    ChatBubbleLeftRightIcon,
    BoltIcon,
    ArrowRightIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const ChatWorkflows = () => {
    const [workflows, setWorkflows] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState('contains'); // 'contains', 'exact'
    const [triggerKeyword, setTriggerKeyword] = useState('');
    const [actions, setActions] = useState([{ type: 'reply_sms', body: '' }]);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('chatWorkflows');
        if (saved) {
            try {
                setWorkflows(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse workflows", e);
            }
        }
    }, []);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem('chatWorkflows', JSON.stringify(workflows));
    }, [workflows]);

    const handleAddNew = () => {
        setIsCreating(true);
        setEditingId(null);
        resetForm();
    };

    const handleEdit = (wf) => {
        setIsCreating(true);
        setEditingId(wf.id);
        setName(wf.name);
        setTriggerType(wf.trigger.type);
        setTriggerKeyword(wf.trigger.keyword);
        setActions(wf.actions);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this workflow?")) {
            setWorkflows(workflows.filter(w => w.id !== id));
        }
    };

    const resetForm = () => {
        setName('');
        setTriggerType('contains');
        setTriggerKeyword('');
        setActions([{ type: 'reply_sms', body: '' }]);
    };

    const handleSaveWorkflow = () => {
        if (!name || !triggerKeyword) return alert("Please fill in Name and Trigger Keyword");

        const newWorkflow = {
            id: editingId || Date.now().toString(),
            name,
            trigger: {
                type: triggerType,
                keyword: triggerKeyword
            },
            actions,
            active: true,
            createdAt: new Date().toISOString()
        };

        if (editingId) {
            setWorkflows(workflows.map(w => w.id === editingId ? newWorkflow : w));
        } else {
            setWorkflows([...workflows, newWorkflow]);
        }

        setIsCreating(false);
        resetForm();
    };

    const addAction = () => {
        setActions([...actions, { type: 'reply_sms', body: '' }]);
    };

    const updateAction = (index, field, value) => {
        const newActions = [...actions];
        newActions[index][field] = value;
        setActions(newActions);
    };

    const removeAction = (index) => {
        const newActions = actions.filter((_, i) => i !== index);
        setActions(newActions);
    };

    if (isCreating) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editingId ? 'Edit Workflow' : 'Create New Workflow'}
                    </h2>
                    <button
                        onClick={() => setIsCreating(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                    {/* Workflow Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workflow Name</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Auto-Reply for Pricing"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Trigger Section */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BoltIcon className="w-4 h-4" /> Trigger
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">When user message...</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value)}
                                >
                                    <option value="contains">Contains Keyword</option>
                                    <option value="exact">Matches Exactly</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Keyword(s)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                                    placeholder="e.g. price, cost, how much"
                                    value={triggerKeyword}
                                    onChange={(e) => setTriggerKeyword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Arrow Connector */}
                    <div className="flex justify-center -my-2 relative z-10">
                        <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-full border border-gray-200 dark:border-gray-600">
                            <ArrowRightIcon className="w-5 h-5 text-gray-400 rotate-90" />
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Actions</h3>
                        </div>

                        {actions.map((action, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                                <button
                                    onClick={() => removeAction(idx)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Do this...</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                                            value={action.type}
                                            onChange={(e) => updateAction(idx, 'type', e.target.value)}
                                        >
                                            <option value="reply_sms">Reply with SMS</option>
                                            <option value="reply_whatsapp">Reply with WhatsApp</option>
                                            <option value="forward">Forward to Agent</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            {action.type === 'forward' ? 'Destination Number' : 'Message Body'}
                                        </label>
                                        {action.type === 'forward' ? (
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                                                placeholder="+1234567890"
                                                value={action.body}
                                                onChange={(e) => updateAction(idx, 'body', e.target.value)}
                                            />
                                        ) : (
                                            <textarea
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm resize-none"
                                                placeholder="Type your message here..."
                                                value={action.body}
                                                onChange={(e) => updateAction(idx, 'body', e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={addAction}
                            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <PlusIcon className="w-4 h-4" /> Add Another Action
                        </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveWorkflow}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                        >
                            {editingId ? 'Update Workflow' : 'Create Workflow'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Workflows</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Automate responses based on key keywords.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Workflow
                </button>
            </div>

            {workflows.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ChatBubbleLeftRightIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No workflows yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Create your first workflow to automatically reply to customers when they ask about specific topics.
                    </p>
                    <button
                        onClick={handleAddNew}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create Workflow
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {workflows.map((wf) => (
                        <div key={wf.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        {wf.name}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${wf.active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {wf.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </h3>
                                    <div className="mt-3 flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                            <BoltIcon className="w-4 h-4" />
                                            <span>If msg {wf.trigger.type} <span className="font-mono font-medium bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">"{wf.trigger.keyword}"</span></span>
                                        </div>
                                        <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <span>{wf.actions.length} Action{wf.actions.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(wf)}
                                        className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                        title="Edit"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(wf.id)}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatWorkflows;
