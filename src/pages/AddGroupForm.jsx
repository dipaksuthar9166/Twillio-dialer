import React, { useState } from 'react';
import { UserGroupIcon, ArrowLeftIcon, PlusIcon, CloudArrowUpIcon, DocumentArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const NAVBAR_HEIGHT_PX = 66; // Assuming Navbar height is 66px

const AddGroupForm = ({ onBack, onSave }) => {
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [contactListType, setContactListType] = useState('manual');
    const [file, setFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        if (!groupName) {
            setError('Group Name is required.');
            return;
        }

        setIsSaving(true);
        
        // Simulate API call delay
        setTimeout(() => {
            const newGroup = {
                id: Date.now().toString(),
                name: groupName,
                description: groupDescription,
                contactsSource: contactListType,
                // In a real app, file/manual list would be processed here
            };

            onSave(newGroup); // Call parent handler
            setIsSaving(false);
        }, 1000);
    };

    return (
        // FIX: Added custom height, padding-top, margin-top, and overflow-y-auto for scrolling
        <div 
            className="p-8 bg-gray-100 flex-grow overflow-y-auto"
            style={{ 
                height: '100vh', 
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, // 66px (Navbar) + 32px (p-8)
                marginTop: `-${NAVBAR_HEIGHT_PX}px` // Pull up under the navbar
            }}
        >
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <UserGroupIcon className="w-8 h-8 text-indigo-600"/> Create New Contact Group
                    </h1>
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                        <ArrowLeftIcon className="w-5 h-5"/> Back to Groups
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-2xl space-y-6 border border-gray-200">
                    
                    {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg text-sm">{error}</div>}

                    {/* Group Details */}
                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">1. Group Identification</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="e.g., Q4 Marketing Leads"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                placeholder="Describe the purpose of this group."
                                rows="2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    {/* Contact List Source */}
                    <div className="border-b pb-6">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">2. Contact List Source</h2>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setContactListType('manual')}
                                className={`flex-1 p-4 rounded-lg border-2 text-sm font-medium transition duration-200 ${
                                    contactListType === 'manual' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                                }`}
                                disabled={isSaving}
                            >
                                <DocumentArrowDownIcon className="w-6 h-6 mx-auto mb-1"/> Manual Entry / Existing List
                            </button>
                            <button
                                type="button"
                                onClick={() => setContactListType('upload')}
                                className={`flex-1 p-4 rounded-lg border-2 text-sm font-medium transition duration-200 ${
                                    contactListType === 'upload' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                                }`}
                                disabled={isSaving}
                            >
                                <CloudArrowUpIcon className="w-6 h-6 mx-auto mb-1"/> Upload CSV File
                            </button>
                        </div>
                        
                        {contactListType === 'upload' && (
                            <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Contacts (CSV)</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-500"
                                    disabled={isSaving}
                                />
                                {file && <p className="mt-2 text-xs text-gray-600">File selected: {file.name}</p>}
                                {!file && <p className="mt-2 text-xs text-red-500">Please select a CSV file with Phone/Name columns.</p>}
                            </div>
                        )}
                        
                    </div>


                    {/* Action Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 animate-spin"/> Saving...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="w-5 h-5"/> Create Group
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGroupForm;