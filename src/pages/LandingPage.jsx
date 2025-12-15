import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PhoneIcon,
    ChatBubbleBottomCenterTextIcon,
    ChartBarIcon,
    BoltIcon,
    UserGroupIcon,
    ClockIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    SparklesIcon,
    GlobeAltIcon,
    ShieldCheckIcon,
    RocketLaunchIcon,
    StarIcon,
    PlayCircleIcon,
    EnvelopeIcon
} from '@heroicons/react/24/solid';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const features = [
        {
            icon: PhoneIcon,
            title: 'Smart Calling',
            description: 'Make bulk calls with intelligent routing and real-time analytics',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: ChatBubbleBottomCenterTextIcon,
            title: 'SMS & WhatsApp',
            description: 'Send bulk messages across SMS and WhatsApp with templates',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: ClockIcon,
            title: 'Auto Messages',
            description: 'Schedule automated message sequences for customer engagement',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: ChartBarIcon,
            title: 'Analytics Dashboard',
            description: 'Track calls, messages, and campaigns with detailed insights',
            color: 'from-orange-500 to-red-500',
        },
        {
            icon: UserGroupIcon,
            title: 'Contact Management',
            description: 'Organize contacts into groups for targeted campaigns',
            color: 'from-indigo-500 to-purple-500',
        },
        {
            icon: BoltIcon,
            title: 'Real-time Updates',
            description: 'Get instant notifications with Socket.IO integration',
            color: 'from-yellow-500 to-orange-500',
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Mitchell',
            role: 'Marketing Director',
            company: 'TechCorp Solutions',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
            rating: 5,
            text: 'This platform transformed our customer outreach. We saw a 300% increase in engagement within just 2 months. Absolutely game-changing!'
        },
        {
            name: 'Michael Chen',
            role: 'Sales Manager',
            company: 'Growth Dynamics',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
            rating: 5,
            text: 'The automation features saved us countless hours every week. Best ROI we\'ve had on any software investment this year!'
        },
        {
            name: 'Emily Rodriguez',
            role: 'CEO',
            company: 'StartupHub Inc.',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
            rating: 5,
            text: 'Reliable, powerful, and incredibly easy to use. Our entire team was up and running in less than an hour. Highly recommended!'
        }
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-lg border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} shadow-sm`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-75"></div>
                                <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <PhoneIcon className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    Twilio Dialer
                                </span>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Communication Platform</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className={`hidden sm:block px-6 py-2.5 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} font-semibold transition-colors`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="relative group px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/50"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Get Started
                                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-gray-900 via-indigo-900/20 to-purple-900/20' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}></div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-30">
                        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                        <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                    </div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full mb-6 backdrop-blur-sm">
                                <SparklesIcon className="w-4 h-4 text-indigo-500" />
                                <span className={`text-sm font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                    Trusted by 10,000+ Businesses Worldwide
                                </span>
                            </div>

                            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Transform Your
                                <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Communication
                                </span>
                                <span className="block mt-2">Strategy</span>
                            </h1>

                            <p className={`text-xl md:text-2xl mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Automate calls, messages, and campaigns with our powerful Twilio-integrated platform.
                                <span className="font-semibold text-indigo-600"> Reach thousands in minutes.</span>
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <RocketLaunchIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        Start Free Trial
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={`group px-8 py-4 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'} rounded-xl border-2 font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <PlayCircleIcon className="w-6 h-6 text-indigo-600" />
                                        Watch Demo
                                    </span>
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-6">
                                {[
                                    'No credit card required',
                                    '14-day free trial',
                                    'Cancel anytime'
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Content - Hero Image */}
                        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                            <div className="relative">
                                {/* Main Hero Image */}
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                    <img
                                        src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop"
                                        alt="Team collaboration"
                                        className="w-full h-auto object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent"></div>
                                </div>

                                {/* Floating Card 1 - Success Rate */}
                                <div className={`absolute -bottom-6 -left-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-100'} backdrop-blur-lg`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                            <CheckCircleIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>99.9%</div>
                                            <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Success Rate</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Card 2 - Active Users */}
                                <div className={`absolute -top-6 -right-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-100'} backdrop-blur-lg`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                            <UserGroupIcon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>10K+</div>
                                            <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Happy Users</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className={`py-20 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '10K+', label: 'Calls Made', icon: PhoneIcon, color: 'from-blue-500 to-cyan-500' },
                            { value: '50K+', label: 'Messages Sent', icon: EnvelopeIcon, color: 'from-green-500 to-emerald-500' },
                            { value: '99.9%', label: 'Uptime', icon: ShieldCheckIcon, color: 'from-purple-500 to-pink-500' },
                            { value: '24/7', label: 'Support', icon: ClockIcon, color: 'from-orange-500 to-red-500' }
                        ].map((stat, index) => (
                            <div key={index} className="text-center group">
                                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="w-10 h-10 text-white" />
                                </div>
                                <div className={`text-4xl md:text-5xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {stat.value}
                                </div>
                                <div className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Powerful Features for
                            <span className="block mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Modern Communication
                            </span>
                        </h2>
                        <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mt-4`}>
                            Everything you need to manage your communication at scale, all in one powerful platform
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`group relative p-8 rounded-3xl ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} border-2 ${isDark ? 'border-gray-700 hover:border-indigo-500' : 'border-gray-100 hover:border-indigo-300'} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {feature.title}
                                </h3>
                                <p className={`text-base leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {feature.description}
                                </p>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRightIcon className="w-6 h-6 text-indigo-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className={`py-24 ${isDark ? 'bg-gray-800/50' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Loved by Businesses
                            <span className="block mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Worldwide
                            </span>
                        </h2>
                        <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto mt-4`}>
                            See what our customers have to say about their experience
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className={`relative p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} border-2 ${isDark ? 'border-gray-700' : 'border-gray-100'} shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
                            >
                                {/* Quote Icon */}
                                <div className="absolute top-6 right-6 text-6xl text-indigo-500/10 font-serif">"</div>

                                {/* Rating */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <StarIcon key={i} className="w-5 h-5 text-yellow-500" />
                                    ))}
                                </div>

                                {/* Testimonial Text */}
                                <p className={`text-base mb-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'} relative z-10`}>
                                    {testimonial.text}
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-500/20"
                                    />
                                    <div>
                                        <div className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {testimonial.name}
                                        </div>
                                        <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {testimonial.role}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {testimonial.company}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 md:p-16 shadow-2xl overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                backgroundSize: '40px 40px'
                            }}></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 text-center">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Ready to Transform Your Communication?
                            </h2>
                            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                                Join thousands of businesses already using our platform. Start your free trial today—no credit card required.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="group inline-flex items-center gap-3 px-12 py-5 bg-white text-indigo-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-105"
                            >
                                <RocketLaunchIcon className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                                Start Your Free Trial
                                <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <p className="text-white/80 text-sm mt-6 font-medium">
                                ✓ No credit card required  •  ✓ 14-day free trial  •  ✓ Cancel anytime
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className={`py-12 ${isDark ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-50 border-t border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <PhoneIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Twilio Dialer</span>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Communication Platform</p>
                            </div>
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            © 2025 Twilio Dialer. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
