import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeftIcon, PlusIcon, ClockIcon, EnvelopeIcon, UserGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = 'http://localhost:3001/api';
// Removed DUMMY_TEMPLATES array
const QUICK_VARIABLES = ['{Name}', '{Address}', '{Zip}', '{State}', '{City}'];
const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar


// Component to handle individual message sequence item
// Now accepts 'templates' prop
const MessageSequenceItem = ({ index, message, updateMessage, removeMessage, templates }) => {

    const handleTemplateSelection = (e) => {
        const selectedId = e.target.value;
        const selectedTemplate = templates.find(t => t.id === selectedId);

        // Update the template ID and automatically update the content
        updateMessage(index, 'templateId', selectedId);
        if (selectedTemplate) {
            updateMessage(index, 'content', selectedTemplate.content);
        } else if (selectedId === '') {
             // Clear content if "Select template" is chosen
             updateMessage(index, 'content', '');
        }
    };

    const handleVariableClick = (variable) => {
        updateMessage(index, 'content', message.content + variable);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-6 mb-4 bg-white">
            {/* Header with # and Day */}
            <div className="flex justify-between items-center mb-4">
                <span className="flex items-center text-sm font-semibold">
                    <span className="px-2 py-1 bg-indigo-600 text-white rounded-l-lg">#{index + 1}</span>
                    <span className="px-2 py-1 bg-green-500 text-white rounded-r-lg">Day {message.day}</span>
                </span>
                {index > 0 && (
                    <button type="button" onClick={() => removeMessage(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                )}
            </div>

            {/* Send on Day & Template */}
            <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEND ON DAY *</label>
                    <input
                        type="number"
                        value={message.day}
                        onChange={(e) => updateMessage(index, 'day', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TEMPLATE</label>
                    <select
                        // Now tracks templateId instead of the name
                        value={message.templateId} 
                        onChange={handleTemplateSelection}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                    >
                        <option value="">Select template</option>
                        {/* Map over the actual fetched templates */}
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Message Content */}
            <label className="block text-sm font-medium text-gray-700 mb-2">MESSAGE CONTENT *</label>
            <textarea
                value={message.content}
                onChange={(e) => updateMessage(index, 'content', e.target.value)}
                placeholder="Enter your message content here..."
                rows="6"
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
            />
            
            {/* Quick Variables */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {QUICK_VARIABLES.map(v => (
                    <span 
                        key={v} 
                        className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full cursor-pointer hover:bg-indigo-200 transition"
                        onClick={() => handleVariableClick(v)}
                    >
                        {v}
                    </span>
                ))}
            </div>
        </div>
    );
};

const CreateAutoMessagePage = ({ onBack }) => {
    const [name, setName] = useState('');
    
    // NEW STATES for Templates
    const [availableTemplates, setAvailableTemplates] = useState([]);
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
    const [templateError, setTemplateError] = useState(null);

    // Initial sequence item now uses 'templateId'
    const [sequences, setSequences] = useState([
        { day: 1, templateId: '', content: '' }
    ]);
    
    // Twilio States
    const [availableTwilioNumbers, setAvailableTwilioNumbers] = useState([]);
    const [selectedTwilioNumber, setSelectedTwilioNumber] = useState('');
    const [isNumbersLoading, setIsNumbersLoading] = useState(true);
    
    const [isSendingImmediately, setIsSendingImmediately] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Recipient States
    const [contactGroups, setContactGroups] = useState([]);
    const [individualContacts, setIndividualContacts] = useState(''); 
    const [isActive, setIsActive] = useState(true);

    // --- FETCH TEMPLATES ---
    const fetchTemplates = async () => {
        setIsTemplatesLoading(true);
        setTemplateError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/templates/all`);
            const templatesData = response.data.templates || [];
            
            setAvailableTemplates(templatesData);
        } catch (error) {
            console.error("Failed to fetch templates:", error);
            setTemplateError("Failed to load templates. Check API connection.");
        } finally {
            setIsTemplatesLoading(false);
        }
    };

    // --- FETCH TWILIO NUMBERS ---
    const fetchTwilioNumbers = async () => {
        setIsNumbersLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/from-numbers`);
            const numbers = response.data || [];
            
            setAvailableTwilioNumbers(numbers);
            if (numbers.length > 0) {
                setSelectedTwilioNumber(numbers[0]);
            }
        } catch (error) {
            console.error("Failed to fetch Twilio numbers:", error);
            setAvailableTwilioNumbers(["+14482317532"]); // Fallback for demo
            setSelectedTwilioNumber("+14482317532");
        } finally {
            setIsNumbersLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTemplates();
        fetchTwilioNumbers();
    }, []);

    const handleAddMessage = () => {
        const lastDay = sequences.length > 0 ? parseInt(sequences[sequences.length - 1].day) : 0;
        setSequences([
            ...sequences, 
            { day: lastDay + 1, templateId: '', content: '' } // Use 'templateId'
        ]);
    };

    const handleRemoveMessage = (index) => {
        // Filter out the sequence item and then re-index the days
        let newSequences = sequences.filter((_, i) => i !== index);
        
        // Optionally, renumber the days to be sequential after removal
        newSequences = newSequences.map((seq, i) => ({
            ...seq,
            day: i + 1 // Simple sequential day re-index
        }));
        
        setSequences(newSequences);
    };

    const handleUpdateMessage = (index, field, value) => {
        const newSequences = sequences.map((seq, i) => 
            i === index ? { ...seq, [field]: value } : seq
        );
        setSequences(newSequences);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!name || sequences.some(s => !s.content) || !selectedTwilioNumber) {
            alert('Please fill in the message name, content for all sequences, and select a Twilio Number.');
            return;
        }

        setIsSubmitting(true);
        
        const payload = {
            name,
            twilioNumber: selectedTwilioNumber,
            status: isActive ? 'active' : 'paused',
            // Map sequences to include template name/content if templateId is set
            sequences: sequences.map(seq => {
                const template = availableTemplates.find(t => t.id === seq.templateId);
                return {
                    day: parseInt(seq.day),
                    content: seq.content,
                    templateId: seq.templateId,
                    templateName: template ? template.name : null,
                };
            }),
            recipients: { contactGroups, individualContacts },
        };
        
        console.log("Submitting Auto Message Payload:", payload);
        
        try {
            // Placeholder for actual POST request
            // const response = await axios.post(`${API_BASE_URL}/auto-messages`, payload);
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            alert(`Auto Message '${name}' created successfully!`);
            onBack(); 
            
        } catch (error) {
            alert("Failed to create Auto Message. Check console for details.");
            console.error("Auto Message Creation Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // 🟢 FIX: Added height, overflow, and position compensation for fixed Navbar
        <div 
            className="p-8 bg-gray-50 flex-grow overflow-y-auto"
            style={{ 
                height: '100vh', 
                paddingTop: `${NAVBAR_HEIGHT_PX + 32}px`, // 66px (Navbar) + 32px (p-8)
                marginTop: `-${NAVBAR_HEIGHT_PX}px` // Pull up under the navbar
            }}
        >
            <header className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Create New Auto Message</h1>
                <button 
                    onClick={onBack}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back to Auto Messages
                </button>
            </header>

            {/* --- Main Form Body --- */}
            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                
                {/* 1. Message Details Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <EnvelopeIcon className="w-6 h-6 mr-3 text-indigo-600" /> Message Details
                    </h2>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter message name"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                </div>

                {/* 2. Message Sequence Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center bg-indigo-500 text-white p-3 rounded-t-lg">
                        <h2 className="flex items-center font-semibold">
                            <ClockIcon className="w-5 h-5 mr-2" /> Message Sequence
                            <span className="ml-3 px-3 py-1 bg-indigo-700 text-xs rounded-full">{sequences.length} Message{sequences.length !== 1 ? 's' : ''}</span>
                        </h2>
                        {isTemplatesLoading && (
                            <span className="flex items-center text-xs">
                                <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" /> Loading Templates...
                            </span>
                        )}
                        <button 
                            type="button" 
                            onClick={handleAddMessage} 
                            className="flex items-center px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                        >
                            <PlusIcon className="w-5 h-5 mr-1" /> Add Message
                        </button>
                    </div>
                    
                    {/* Template Load Error */}
                    {templateError && (
                        <div className="text-red-600 bg-red-100 p-3 rounded-b-lg">{templateError}</div>
                    )}

                    <div className="p-4 bg-gray-50 rounded-b-lg">
                        {sequences.map((seq, index) => (
                            <MessageSequenceItem 
                                key={index}
                                index={index}
                                message={seq}
                                updateMessage={handleUpdateMessage}
                                removeMessage={handleRemoveMessage}
                                templates={availableTemplates} // PASSING THE FETCHED TEMPLATES
                            />
                        ))}
                    </div>
                </div>

                {/* 3. Recipients & Settings Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <UserGroupIcon className="w-6 h-6 mr-3 text-pink-600" /> Recipients & Settings
                    </h2>

                    {/* Twilio Number (Dropdown) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Twilio Number *</label>
                        {isNumbersLoading ? (
                            <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 flex items-center">
                                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> Loading available numbers...
                            </div>
                        ) : availableTwilioNumbers.length === 0 ? (
                            <div className="w-full p-3 border border-red-300 rounded-lg bg-red-50 text-red-700">
                                No numbers available
                            </div>
                        ) : (
                             <select
                                 value={selectedTwilioNumber}
                                 onChange={(e) => setSelectedTwilioNumber(e.target.value)}
                                 className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                                 required
                             >
                                 {availableTwilioNumbers.map(number => (
                                     <option key={number} value={number}>
                                         {number}
                                     </option>
                                 ))}
                             </select>
                        )}
                    </div>
                    
                    {/* Contact Groups Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Groups</label>
                        <select
                            multiple
                            value={contactGroups}
                            onChange={(e) => setContactGroups(Array.from(e.target.selectedOptions, option => option.value))}
                            className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px]"
                        >
                            <option value="GroupA">Group A (100)</option>
                            <option value="GroupB">Group B (50)</option>
                            <option value="NewLeads">New Leads (200)</option>
                        </select>
                    </div>

                    {/* Individual Contacts */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Individual Contacts</label>
                        <input
                            type="text"
                            value={individualContacts}
                            onChange={(e) => setIndividualContacts(e.target.value)}
                            placeholder="Select individual contacts (e.g., John Doe, +123...)"
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            id="active-toggle"
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="active-toggle" className="ml-2 block text-sm font-medium text-gray-700">
                            Active (Start sending immediately)
                        </label>
                    </div>
                </div>

                {/* --- Action Buttons (Fixed Footer Look-alike) --- */}
                <div className="flex justify-end space-x-4 bg-gray-100 p-4 rounded-lg sticky bottom-0 border-t border-gray-300">
                    <button 
                        type="button" 
                        onClick={onBack}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center disabled:bg-indigo-400"
                        disabled={isSubmitting || availableTwilioNumbers.length === 0}
                    >
                        {isSubmitting ? <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                        {isSubmitting ? 'Creating...' : 'Create Auto Message'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateAutoMessagePage;