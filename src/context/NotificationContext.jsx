import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { BellIcon, XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [volume, setVolume] = useState(() => parseFloat(localStorage.getItem('notificationVolume')) || 0.7);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('notificationMuted') === 'true');
  const [soundPlaying, setSoundPlaying] = useState(false);
  const audioRef = useRef(null);

  // 🔊 Better notification sounds - Multiple options
  const notificationSounds = {
    default: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    chime: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    bell: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3',
    pop: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3'
  };

  const [selectedSound, setSelectedSound] = useState(() => localStorage.getItem('notificationSound') || 'chime');

  // Pre-load audio
  useEffect(() => {
    audioRef.current = new Audio(notificationSounds[selectedSound]);
    audioRef.current.volume = volume;
  }, [selectedSound, volume]);

  // Play sound with visual feedback
  const playSound = useCallback(() => {
    if (!isMuted && audioRef.current) {
      setSoundPlaying(true);
      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          setTimeout(() => setSoundPlaying(false), 500);
        })
        .catch(error => {
          console.warn("Audio play prevented:", error);
          setSoundPlaying(false);
        });
    }
  }, [volume, isMuted]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    playSound();
  }, [playSound]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    localStorage.setItem('notificationVolume', newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      localStorage.setItem('notificationMuted', 'false');
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('notificationMuted', newMutedState);
  };

  const changeSoundType = (soundType) => {
    setSelectedSound(soundType);
    localStorage.setItem('notificationSound', soundType);
    if (audioRef.current) {
      audioRef.current.src = notificationSounds[soundType];
    }
  };

  const testSound = () => {
    playSound();
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    volume,
    isMuted,
    soundPlaying,
    selectedSound,
    handleVolumeChange,
    toggleMute,
    changeSoundType,
    testSound,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Enhanced NotificationBell component with sound options
export const NotificationBell = () => {
  const {
    notifications,
    clearNotifications,
    volume,
    isMuted,
    soundPlaying,
    selectedSound,
    handleVolumeChange,
    toggleMute,
    changeSoundType,
    testSound
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const soundOptions = [
    { id: 'chime', name: '🔔 Chime', desc: 'Soft bell sound' },
    { id: 'bell', name: '🛎️ Bell', desc: 'Classic notification' },
    { id: 'pop', name: '💫 Pop', desc: 'Quick pop sound' },
    { id: 'default', name: '🎵 Default', desc: 'Standard tone' }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2 rounded-full transition-all duration-300 ${soundPlaying
            ? 'bg-amber-200 text-amber-700 scale-110'
            : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
      >
        <BellIcon className={`w-6 h-6 ${soundPlaying ? 'animate-bounce' : ''}`} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <MusicalNoteIcon className="w-3 h-3" />
                {showSettings ? 'Hide' : 'Settings'}
              </button>
              {notifications.length > 0 && (
                <button onClick={clearNotifications} className="text-xs text-red-600 dark:text-red-400 hover:underline">
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Sound Settings */}
          {showSettings && (
            <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Sound Settings</p>

              {/* Volume Control */}
              <div className="flex items-center gap-3 mb-3">
                <button onClick={toggleMute} className="flex-shrink-0">
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <SpeakerWaveIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{Math.round(volume * 100)}%</span>
              </div>

              {/* Sound Type Selection */}
              <div className="space-y-1">
                {soundOptions.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => {
                      changeSoundType(sound.id);
                      testSound();
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all ${selectedSound === sound.id
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{sound.name}</span>
                      {selectedSound === sound.id && <span className="text-indigo-600 dark:text-indigo-400">✓</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-500">{sound.desc}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={testSound}
                className="w-full mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition-all"
              >
                🔊 Test Sound
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No new notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{n.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{n.message}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(n.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};