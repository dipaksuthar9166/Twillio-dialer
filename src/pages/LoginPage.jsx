import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserIcon, LockClosedIcon, AtSymbolIcon, ArrowRightOnRectangleIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, FingerPrintIcon, ShieldCheckIcon, PhoneIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

const API_BASE_URL = 'http://localhost:3001/api';

const fetchApi = async (endpoint, payload) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                throw new Error(`Server returned status ${response.status}. Please ensure backend is running.`);
            }
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        throw new Error(error.message || "Network request failed.");
    }
};

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const loadingTexts = [
        "Verifying Credentials...",
        "Establishing Secure Connection...",
        "Decrypting User Data...",
        "Loading Dashboard Modules...",
        "Access Granted"
    ];

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const playWelcomeSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play failed", e));
    };

    const handleSuccessSequence = (email, userId) => {
        setIsSuccess(true);
        playWelcomeSound();

        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < loadingTexts.length) {
                setLoadingStep(step);
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    onLoginSuccess(email, userId);
                }, 500);
            }
        }, 600);
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isValidEmail(username)) {
            setError("Please enter a valid email address.");
            setIsLoading(false);
            return;
        }
        if (isRegistering && password.length < 5) {
            setError("Password must be at least 5 characters.");
            setIsLoading(false);
            return;
        }
        if (isRegistering && password !== confirmPassword) {
            setError("Passwords do not match!");
            setIsLoading(false);
            return;
        }

        const endpoint = isRegistering ? '/register' : '/login';
        const payload = { username, password };

        try {
            const data = await fetchApi(endpoint, payload);

            if (isRegistering) {
                setError(`Registration successful! Please sign in.`);
                setIsRegistering(false);
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setIsLoading(false);
            } else {
                handleSuccessSequence(username, data.userId);
            }
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsLoading(true);
        const simulatedGoogleEmail = 'dipaksuthr@gmail.com';
        try {
            const data = await fetchApi('/google-login', { email: simulatedGoogleEmail });
            if (data.success && data.userId) {
                handleSuccessSequence(simulatedGoogleEmail, data.userId);
            } else {
                throw new Error("Failed to authenticate via Google.");
            }
        } catch (err) {
            setError(err.message || "Google Sign-In failed.");
            setIsLoading(false);
        }
    };

    const toggleRegistering = () => {
        setIsRegistering(prev => !prev);
        setError('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="z-10 flex flex-col items-center w-full max-w-lg px-4">
                    {/* Scanner Animation */}
                    <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                        {/* Pulse Rings */}
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDelay: '0.5s' }}></div>

                        {/* Core Icon */}
                        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                            <ShieldCheckIcon className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center space-y-6 w-full">
                        <h2 className="text-3xl font-bold text-white tracking-wide">
                            {loadingTexts[loadingStep]}
                        </h2>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                                style={{ width: `${((loadingStep + 1) / loadingTexts.length) * 100}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider">
                            <span>Secure Connection</span>
                            <span>{Math.round(((loadingStep + 1) / loadingTexts.length) * 100)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-900 transition-colors duration-300">
            {/* Left Side - Image & Social Proof */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gray-900">
                {/* Background Image */}
                <img
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&h=1600&fit=crop"
                    alt="Team collaboration"
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/90 mix-blend-multiply"></div>

                {/* Content Container */}
                <div className="relative z-10 p-16 flex flex-col justify-between w-full h-full">
                    {/* Top: Logo (Clickable) */}
                    <Link to="/" className="flex items-center gap-3 group w-fit">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl group-hover:scale-105 transition-transform">
                            <PhoneIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-white tracking-tight">Twilio Dialer</span>
                            <p className="text-xs text-white/70 font-medium">Enterprise Edition</p>
                        </div>
                    </Link>

                    {/* Middle: Hero Text */}
                    <div className="max-w-xl space-y-6">
                        <h1 className="text-5xl font-bold text-white leading-tight">
                            Connect with your customers
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300">
                                like never before.
                            </span>
                        </h1>
                        <p className="text-lg text-indigo-100/90 leading-relaxed font-light">
                            Experience the next generation of communication. Automated, intelligent, and designed for scale.
                        </p>

                        {/* User Avatars & Stats */}
                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-4">
                                {[
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
                                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                                ].map((src, i) => (
                                    <img key={i} src={src} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-900 object-cover ring-2 ring-white/20" />
                                ))}
                            </div>
                            <div className="text-sm">
                                <p className="text-white font-bold">10,000+ Users</p>
                                <p className="text-indigo-200 text-xs">Trust our platform</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Testimonial Card */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md transform hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed mb-4">
                            "This dialer has completely transformed our sales process. The automation features alone saved us 20 hours a week. Highly recommended!"
                        </p>
                        <div className="flex items-center gap-3">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop" alt="Sarah" className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <p className="text-white font-semibold text-sm">Sarah Jenkins</p>
                                <p className="text-indigo-200 text-xs">VP of Sales, TechFlow</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
                {/* Back to Home Button (Mobile/Desktop) */}
                <div className="absolute top-6 left-6 z-20">
                    <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm hover:shadow-md group">
                        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold">Back to Home</span>
                    </Link>
                </div>

                {/* Animated Background Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/5 blur-3xl animate-blob"></div>
                    <div className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-500/5 blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10 mt-12 lg:mt-0">
                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            {isRegistering ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            {isRegistering ? 'Start your 14-day free trial today.' : 'Please enter your details to sign in.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {/* Email Input */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <AtSymbolIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="group">
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                {!isRegistering && (
                                    <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password (Register Only) */}
                        {isRegistering && (
                            <div className="group animate-slide-in">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                                    Confirm Password
                                </label>
                                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-3 animate-shake ${error.includes('successful') ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
                                {error.includes('successful') ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" /> : <div className="w-2 h-2 rounded-full bg-current flex-shrink-0"></div>}
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isRegistering ? 'Create Account' : 'Sign In'}
                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 font-medium">Or continue with</span>
                            </div>
                        </div>

                        {/* Google Sign In */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-3 py-3.5 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.025c0-.783-.069-1.536-.188-2.261H12.0v4.275h6.388c-.28 1.488-1.144 2.766-2.428 3.633v3.297h4.257c2.493-2.3 3.931-5.7 3.931-9.245z" fill="#4285F4" />
                                <path d="M12.0 23.003c3.238 0 5.955-1.077 7.94-2.923l-4.257-3.297c-1.182.793-2.695 1.258-3.682 1.258-2.825 0-5.215-1.921-6.059-4.509H1.724v3.376C3.719 20.941 7.502 23.003 12.0 23.003z" fill="#34A853" />
                                <path d="M5.941 14.286c-.198-.567-.312-1.18-.312-1.787s.114-1.22.312-1.787V7.34H1.724c-.655 1.341-1.012 2.853-1.012 4.453s.357 3.112 1.012 4.453L5.941 14.286z" fill="#FBBC04" />
                                <path d="M12.0 4.993c1.786 0 3.37.616 4.606 1.76l3.774-3.64C17.957 1.054 15.24 0 12.0 0-7.502 0-3.719 2.062-.284 5.993L5.94 9.349c.844-2.588 3.234-4.509 6.06-4.509z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                    </form>

                    {/* Toggle Register/Login */}
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {isRegistering ? "Already have an account?" : "Don't have an account?"}{' '}
                        <button
                            onClick={toggleRegistering}
                            className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors hover:underline"
                        >
                            {isRegistering ? 'Sign in' : 'Sign up for free'}
                        </button>
                    </p>
                </div>

                {/* CSS for Animations */}
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
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                        20%, 40%, 60%, 80% { transform: translateX(4px); }
                    }
                    .animate-shake {
                        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default LoginPage;
