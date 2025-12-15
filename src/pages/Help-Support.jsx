import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PaperAirplaneIcon, LifebuoyIcon, PhoneIcon, EnvelopeIcon, ChatBubbleBottomCenterTextIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { MapPinIcon, ClockIcon, QuestionMarkCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = 'http://localhost:3001/api';
const NAVBAR_HEIGHT_PX = 66; // Fixed height of the top Navbar

// --- MAIN COMPONENT ---
const HelpAndSupportPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        emailAddress: '',
        subject: '',
        message: ''
    });
    const [contactInfo, setContactInfo] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error'

    // Fetch Contact Info from Backend
    const fetchContactInfo = async () => {
        try {
            // Placeholder: Replace with actual API call if available
            // const response = await axios.get(`${API_BASE_URL}/support/contact-info`);
            
            // Dummy Data Fallback:
            setContactInfo({ 
                email: 'support@trialdialer.com', 
                phone: '+91-98765-43210', 
                liveChat: 'Available 24/7 (via floating button)', 
                phoneHours: 'Mon-Fri, 9am - 5pm IST' 
            }); 
            
        } catch (error) {
            console.error("Failed to fetch contact info:", error);
            setContactInfo({ email: 'info@support.com', phone: 'N/A', liveChat: 'N/A', phoneHours: 'N/A' }); 
        }
    };

    useEffect(() => {
        fetchContactInfo();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmissionStatus(null);

        // Basic form validation
        if (!formData.fullName || !formData.emailAddress || !formData.subject || !formData.message) {
            setSubmissionStatus('error');
            setIsSubmitting(false);
            return;
        }

        try {
            // Placeholder: Simulate API success/failure
            await new Promise((resolve) => setTimeout(resolve, 1500));
            // const response = await axios.post(`${API_BASE_URL}/support/request`, formData);

            // Simulate success
            setSubmissionStatus('success');
            // Reset form fields
            setFormData({ fullName: '', emailAddress: '', subject: '', message: '' });

        } catch (error) {
            console.error("Submission error:", error.message);
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const StatusMessage = ({ status }) => {
        if (!status) return null;
        const isSuccess = status === 'success';
        const msg = isSuccess ? "Success! Your support request has been sent. We will contact you soon." : "Error! Failed to send request. Please ensure all fields are filled and try again.";
        const bgColor = isSuccess ? "bg-green-100 border-green-400 text-green-700" : "bg-red-100 border-red-400 text-red-700";

        return (
            <div className={`p-4 mb-4 border rounded-lg flex items-center ${bgColor}`}>
                <ExclamationCircleIcon className="w-5 h-5 mr-3" />
                <p className="font-medium text-sm">{msg}</p>
            </div>
        );
    };

    return (
        // 🟢 FIX: Added height, overflow, and position compensation for fixed Navbar
        <div 
            className="flex bg-gray-50 flex-grow overflow-y-auto"
            style={{ 
                height: '100vh', 
                paddingTop: `${NAVBAR_HEIGHT_PX + 24}px`, // 66px (Navbar) + 24px (p-6)
                marginTop: `-${NAVBAR_HEIGHT_PX}px` // Pull up under the navbar
            }}
        >
            
            <main className="flex-1 p-6 flex space-x-6">
                
                {/* Left Column: Support Form */}
                <div className="flex-2 w-2/3 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <QuestionMarkCircleIcon className="w-6 h-6 mr-3 text-indigo-600" /> Send Support Request
                    </h2>
                    
                    <StatusMessage status={submissionStatus} />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name and Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    name="emailAddress"
                                    value={formData.emailAddress}
                                    onChange={handleChange}
                                    placeholder="Enter your email" 
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="Brief description of the issue" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Please describe your issue in detail..." 
                                rows="6"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            ></textarea>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center disabled:bg-indigo-400"
                        >
                            {isSubmitting ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Sending Request...
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="w-5 h-5 mr-2 -rotate-45" /> Send Support Request
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                {/* Right Column: Contact Info & Quick Help */}
                <div className="flex-1 space-y-6 w-1/3">
                    
                    {/* Contact Information Card */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center text-pink-600">
                            <MapPinIcon className="w-5 h-5 mr-2" /> Contact Information
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Email */}
                            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <EnvelopeIcon className="w-5 h-5 mt-1 text-indigo-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-800">Email Support</p>
                                    <p className="text-sm text-indigo-600">{contactInfo.email || 'loading...'}</p>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <PhoneIcon className="w-5 h-5 mt-1 text-indigo-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-800">Phone Support</p>
                                    <p className="text-sm text-gray-600">Available: {contactInfo.phoneHours || 'loading...'}</p>
                                </div>
                            </div>
                            
                            {/* Live Chat */}
                            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mt-1 text-indigo-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-800">Live Chat</p>
                                    <p className="text-sm text-gray-600">{contactInfo.liveChat || 'loading...'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Quick Help Card */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center text-red-600">
                            <LifebuoyIcon className="w-5 h-5 mr-2" /> Quick Help
                        </h3>
                        <div className="flex justify-around text-center">
                            <a href="#" className="p-4 rounded-lg hover:bg-gray-50 transition">
                                <MapPinIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                                <p className="text-sm font-medium">Support Docs</p> 
                            </a>
                            <a href="#" className="p-4 rounded-lg hover:bg-gray-50 transition">
                                <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                                <p className="text-sm font-medium">Live Help</p> 
                            </a>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default HelpAndSupportPage;