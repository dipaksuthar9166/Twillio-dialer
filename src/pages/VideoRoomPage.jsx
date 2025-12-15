import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Video from 'twilio-video';
import { VideoCameraIcon, MicrophoneIcon, PhoneXMarkIcon, VideoCameraSlashIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VideoRoomPage = () => {
    const { roomName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isAudioOnly = queryParams.get('type') === 'audio';
    const [room, setRoom] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [token, setToken] = useState(null);
    const [identity, setIdentity] = useState('');
    const [isJoined, setIsJoined] = useState(false);

    // Media Controls
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(!isAudioOnly);

    // Refs for DOM elements
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (room) {
                room.disconnect();
            }
        };
    }, [room]);

    const handleJoin = async () => {
        if (!identity) {
            alert("Please enter your name to join.");
            return;
        }

        try {
            // 1. Get Token
            const response = await fetch(`${API_BASE_URL}/api/consultation/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, identity })
            });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            setToken(data.token);

            // 2. Connect to Room
            const videoRoom = await Video.connect(data.token, {
                name: roomName,
                audio: true,
                video: isAudioOnly ? false : { width: 640 }
            });

            setRoom(videoRoom);
            setIsJoined(true);

            // 3. Handle Local Video
            if (!isAudioOnly) {
                Video.createLocalVideoTrack().then(track => {
                    const localContainer = localVideoRef.current;
                    if (localContainer) {
                        localContainer.appendChild(track.attach());
                    }
                });
            }

            // 4. Handle Existing Participants
            videoRoom.participants.forEach(participant => {
                participantConnected(participant);
            });

            // 5. Handle New Participants
            videoRoom.on('participantConnected', participant => {
                participantConnected(participant);
            });

            videoRoom.on('participantDisconnected', participant => {
                participantDisconnected(participant);
            });

        } catch (error) {
            console.error("Error joining room:", error);
            alert("Failed to join room: " + error.message);
        }
    };

    const participantConnected = (participant) => {
        setParticipants(prev => [...prev, participant]);

        participant.tracks.forEach(publication => {
            if (publication.isSubscribed) {
                const track = publication.track;
                const remoteContainer = remoteVideoRef.current;
                if (remoteContainer) remoteContainer.appendChild(track.attach());
            }
        });

        participant.on('trackSubscribed', track => {
            const remoteContainer = remoteVideoRef.current;
            if (remoteContainer) remoteContainer.appendChild(track.attach());
        });
    };

    const participantDisconnected = (participant) => {
        setParticipants(prev => prev.filter(p => p !== participant));
        // Cleanup tracks if needed (Twilio handles detach usually)
    };

    const handleDisconnect = () => {
        if (room) {
            room.disconnect();
        }
        setRoom(null);
        setIsJoined(false);
        navigate('/'); // Go back to dashboard
    };

    const toggleAudio = () => {
        if (room) {
            room.localParticipant.audioTracks.forEach(publication => {
                if (isAudioEnabled) publication.track.disable();
                else publication.track.enable();
            });
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const toggleVideo = () => {
        if (room) {
            room.localParticipant.videoTracks.forEach(publication => {
                if (isVideoEnabled) publication.track.disable();
                else publication.track.enable();
            });
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const provider = queryParams.get('provider');

    if (provider === 'jitsi') {
        return (
            <div className="flex flex-col h-screen bg-gray-900">
                <div className="bg-gray-800 p-4 flex justify-between items-center text-white shadow-md">
                    <h1 className="text-lg font-semibold">Consultation: {roomName}</h1>
                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-red-600 rounded text-sm hover:bg-red-700 transition">End Call</button>
                </div>
                <iframe
                    src={`https://meet.jit.si/${roomName}#config.startWithAudioMuted=false&config.startWithVideoMuted=${isAudioOnly}`}
                    className="flex-1 w-full border-0"
                    allow="camera; microphone; fullscreen; display-capture"
                ></iframe>
            </div>
        );
    }

    if (!isJoined) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Join Video Consultation</h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                        <input
                            type="text"
                            value={identity}
                            onChange={(e) => setIdentity(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter your name"
                        />
                    </div>
                    <button
                        onClick={handleJoin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                    >
                        Join Room
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center text-white shadow-md">
                <h1 className="text-lg font-semibold">Consultation: {roomName}</h1>
                <div className="text-sm text-gray-400">
                    Participants: {participants.length + 1}
                </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
                {/* Remote Video (Main) */}
                <div className="flex-1 bg-black rounded-lg relative flex items-center justify-center overflow-hidden">
                    <div ref={remoteVideoRef} className="w-full h-full flex items-center justify-center [&>video]:max-h-full [&>video]:max-w-full"></div>
                    {participants.length === 0 && (
                        <div className="absolute text-white text-center">
                            <p className="text-xl">Waiting for others to join...</p>
                        </div>
                    )}
                </div>

                {/* Local Video (PiP) */}
                <div className="w-full md:w-64 h-48 bg-gray-800 rounded-lg border-2 border-gray-700 overflow-hidden relative shadow-xl">
                    <div ref={localVideoRef} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"></div>
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">You</div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 p-6 flex justify-center gap-6">
                <button
                    onClick={toggleAudio}
                    className={`p-4 rounded-full ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'} text-white transition`}
                >
                    {isAudioEnabled ? <MicrophoneIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                </button>

                <button
                    onClick={handleDisconnect}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-lg"
                >
                    <PhoneXMarkIcon className="w-8 h-8" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'} text-white transition`}
                >
                    {isVideoEnabled ? <VideoCameraIcon className="w-6 h-6" /> : <VideoCameraSlashIcon className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};

export default VideoRoomPage;
