import React, { useState, useEffect } from 'react';
import {
    CpuChipIcon,
    BoltIcon,
    ChatBubbleLeftRightIcon,
    KeyIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import ChatWorkflows from '../components/ChatWorkflows';

const AutomationsPage = () => {
    const [activeTab, setActiveTab] = useState('ai-config');
    const [aiProvider, setAiProvider] = useState('gemini'); // 'gemini' or 'openai'
    const [geminiKey, setGeminiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [systemPromptEn, setSystemPromptEn] = useState("You are a helpful phone assistant. Keep your answers concise, friendly, and strictly under 50 words for a voice call.");
    const [systemPromptHi, setSystemPromptHi] = useState("You are a helpful phone assistant. Reply in Hindi (using Romanized Hindi/Hinglish or Devanagari as appropriate for text-to-speech). Keep answers concise and strictly under 50 words.");
    const [isSaved, setIsSaved] = useState(false);

    // Mock loading saved settings
    useEffect(() => {
        // In a real app, fetch these from backend
        const savedProvider = localStorage.getItem('aiProvider');
        if (savedProvider) setAiProvider(savedProvider);

        const savedGemini = localStorage.getItem('geminiKey');
        if (savedGemini) setGeminiKey(savedGemini);

        const savedOpenai = localStorage.getItem('openaiKey');
        if (savedOpenai) setOpenaiKey(savedOpenai);
    }, []);

    const handleSave = () => {
        // In a real app, send to backend API
        localStorage.setItem('aiProvider', aiProvider);
        localStorage.setItem('geminiKey', geminiKey);
        localStorage.setItem('openaiKey', openaiKey);

        // Simulate saving
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-slate-900">
            {/* Sidebar for Settings */}
            <div className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BoltIcon className="w-6 h-6 text-indigo-500" />
                        Automations
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage AI & Workflows</p>
                </div>
                <nav className="px-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('ai-config')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ai-config'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <CpuChipIcon className="w-5 h-5" />
                        AI Configuration
                    </button>
                    <button
                        onClick={() => setActiveTab('workflows')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'workflows'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        Chat Workflows
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'ai-config' && (
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Configuration</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Configure the AI brains behind your automated calls and messages.</p>
                        </div>

                        {/* Provider Selection */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select AI Provider</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setAiProvider('gemini')}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${aiProvider === 'gemini'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200'
                                        }`}
                                >
                                    <div className="font-semibold text-gray-900 dark:text-white">Google Gemini</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Fast, reliable, and cost-effective. Best for voice.</div>
                                </button>
                                <button
                                    onClick={() => setAiProvider('openai')}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${aiProvider === 'openai'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200'
                                        }`}
                                >
                                    <div className="font-semibold text-gray-900 dark:text-white">OpenAI (ChatGPT)</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Powerful reasoning. Industry standard for text.</div>
                                </button>
                            </div>
                        </div>

                        {/* API Keys */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <KeyIcon className="w-5 h-5 text-gray-500" />
                                API Credentials
                            </h3>

                            {aiProvider === 'gemini' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Gemini API Key</label>
                                        <input
                                            type="password"
                                            value={geminiKey}
                                            onChange={(e) => setGeminiKey(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            placeholder="AIza..."
                                        />
                                    </div>
                                </div>
                            )}

                            {aiProvider === 'openai' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OpenAI API Key</label>
                                        <input
                                            type="password"
                                            value={openaiKey}
                                            onChange={(e) => setOpenaiKey(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            placeholder="sk-..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* System Prompts */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Prompts</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">English Prompt (Press 1)</label>
                                    <textarea
                                        rows={3}
                                        value={systemPromptEn}
                                        onChange={(e) => setSystemPromptEn(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hindi Prompt (Press 2)</label>
                                    <textarea
                                        rows={3}
                                        value={systemPromptHi}
                                        onChange={(e) => setSystemPromptHi(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                {isSaved ? (
                                    <>
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Saved!
                                    </>
                                ) : (
                                    'Save Configuration'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'workflows' && (
                    <div className="h-full">
                        <ChatWorkflows />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutomationsPage;
