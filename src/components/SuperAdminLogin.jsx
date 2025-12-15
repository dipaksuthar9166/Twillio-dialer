import React, { useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';
// Assuming 'logo.png' is the image for 'OpenVBX' logo

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('dipaksuthr@gmail.com'); // Pre-filled for demo
  const [password, setPassword] = useState('********');
  const [message, setMessage] = useState('Super Admin: Ready to connect');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 1. Call your backend API here
    // 2. Handle success/error and update the 'message' state
    console.log('Logging in with:', email, password);
    setMessage('Connecting...');
    // Example: fetch('/api/admin/login', ...)
  };

  const AnimatedShape = ({ style, className }) => (
    <div
      className={`absolute bg-opacity-30 rounded-full mix-blend-screen ${className}`}
      style={style}
    ></div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      {/* --- Animated Background Shapes --- */}
      <AnimatedShape 
        className="w-40 h-40 bg-purple-500 animate-float-slow -top-10 -left-10 rounded-xl"
        style={{ animationDelay: '0s' }}
      />
      <AnimatedShape 
        className="w-24 h-24 bg-yellow-400 animate-float top-1/4 left-1/4 rounded-full"
        style={{ animationDelay: '5s' }}
      />
      <AnimatedShape 
        className="w-60 h-60 bg-indigo-500 animate-float-slow -bottom-10 right-1/4 rounded-xl opacity-50"
        style={{ animationDelay: '10s' }}
      />
      <AnimatedShape 
        className="w-32 h-32 bg-pink-500 animate-float top-1/2 right-0 rounded-full"
        style={{ animationDelay: '15s' }}
      />
      {/* --- Login Card --- */}
      <div className="relative z-10 w-full max-w-sm p-8 space-y-6 bg-white bg-opacity-10 backdrop-blur-md rounded-2xl shadow-2xl border border-white border-opacity-20">
        <div className="flex flex-col items-center space-y-4">
          {/* Replace with your actual logo */}
          <div className="text-xl font-bold text-white">OpenVBX</div>
          <p className="text-xs text-white text-opacity-70">POWERED BY TEQUANL</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-white bg-white bg-opacity-20 border border-transparent focus:border-purple-400 focus:ring focus:ring-purple-400 focus:ring-opacity-50 rounded-lg transition duration-200 placeholder-gray-400"
                required
              />
              {/* Checkmark Icon */}
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </span>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-white bg-white bg-opacity-20 border border-transparent focus:border-purple-400 focus:ring focus:ring-purple-400 focus:ring-opacity-50 rounded-lg transition duration-200"
                required
              />
              {/* Eye Icon (for show/hide password, omitted for brevity) */}
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                 {/* Omitted: <FiEye /> or similar */}
              </span>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 transition duration-200"
          >
            Sign In <FiArrowRight className="ml-2" />
          </button>
        </form>

        {/* Status Message */}
        <div className="flex items-center justify-center p-3 text-sm text-white bg-white bg-opacity-10 rounded-full">
          <span className="mr-2 text-xl align-middle">⭐</span>
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;