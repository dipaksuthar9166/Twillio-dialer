import React, { useState } from 'react';
import { ChevronLeftIcon, ClipboardDocumentListIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar

const FlowCreationPage = ({ onBack, onSave }) => {
    const [flowName, setFlowName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!flowName.trim()) {
            alert('Please fill in Flow Name.');
            return;
        }

        setIsSaving(true);
        
        // The onSave function will handle the actual API call
        await onSave({ flowName });
        
        setIsSaving(false);
    };

    return (
        <div 
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{ 
                height: '100vh', 
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`,
                marginTop: `-${NAVBAR_HEIGHT_PX}px`
            }}
        >
            <div className="bg-white min-h-[90vh] shadow-2xl rounded-lg border border-gray-200 mx-auto max-w-6xl">
                
                <div className="p-8">
                    <header className="flex justify-between items-center mb-6 border-b pb-4">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            <ClipboardDocumentListIcon className='w-7 h-7 mr-3 text-indigo-600' /> Create New Call Flow
                        </h1>
                        <button 
                            onClick={onBack}
                            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back to Directory
                        </button>
                    </header>

                    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8 mx-auto mt-12">
                        
                        <div className="p-6 bg-gray-50 rounded-xl space-y-4">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                                Basic Details
                            </h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Flow Name *</label>
                                <input type="text" required value={flowName} onChange={(e) => setFlowName(e.target.value)}
                                    placeholder="e.g., Main IVR, Sales Queue"
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-4 pt-8">
                            <button 
                                type="button" 
                                onClick={onBack}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center disabled:bg-indigo-400"
                                disabled={isSaving}
                            >
                                {isSaving ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                                {isSaving ? 'Saving Flow...' : 'Create Flow'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FlowCreationPage;