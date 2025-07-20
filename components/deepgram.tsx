import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface ConversationMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface AgentSettings {
  language?: string;
  greeting?: string;
  prompt?: string;
  model?: string;
  ttsModel?: string;
  sttModel?: string;
}

const DeepgramVoiceAgent: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    
    // Stop any playing audio
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Play audio from queue
  const playNextAudio = useCallback(() => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0 || isPlayingRef.current || isSpeakerMuted) {
      return;
    }

    const audioBuffer = audioQueueRef.current.shift();
    if (!audioBuffer) return;

    isPlayingRef.current = true;
    setIsAgentSpeaking(true);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    sourceNodeRef.current = source;

    source.onended = () => {
      isPlayingRef.current = false;
      sourceNodeRef.current = null;
      
      if (audioQueueRef.current.length === 0) {
        setIsAgentSpeaking(false);
      }
      
      // Play next audio in queue
      playNextAudio();
    };

    source.start();
  }, [isSpeakerMuted]);

  // Process incoming audio data
  const processAudioData = useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return;

    try {
      // The audio is in linear16 format, we need to convert it to AudioBuffer
      const audioArray = new Int16Array(audioData);
      const floatArray = new Float32Array(audioArray.length);
      
      // Convert Int16 to Float32
      for (let i = 0; i < audioArray.length; i++) {
        floatArray[i] = audioArray[i] / 32768.0;
      }

      // Create AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(1, floatArray.length, 24000);
      audioBuffer.getChannelData(0).set(floatArray);

      // Add to queue and play
      audioQueueRef.current.push(audioBuffer);
      playNextAudio();
    } catch (err) {
      console.error('Error processing audio:', err);
    }
  }, [playNextAudio]);

  const connect = async () => {
    try {
      setError(null);
      setIsConnecting(true);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      mediaStreamRef.current = stream;

      // Create audio context for playback
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Get WebSocket URL from API
      const response = await fetch('/api/deepgram-voice-agent', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get Deepgram connection');
      }

      const { url } = await response.json();

      // Create WebSocket connection
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected, sending settings...');
        
        // Send settings configuration
        const settings = {
          type: "Settings",
          audio: {
            input: {
              encoding: "linear16",
              sample_rate: 24000
            },
            output: {
              encoding: "linear16",
              sample_rate: 24000,
              container: "none"
            }
          },
          agent: {
            listen: {
              model: "nova-2"
            },
            think: {
              provider: {
                type: "open_ai"
              },
              model: "gpt-4o-mini",
              instructions: "You are a helpful and friendly AI assistant. Keep your responses concise and natural."
            },
            speak: {
              model: "aura-asteria-en"
            }
          },
          // Optional: Add a greeting message
          greeting: "Hello! I'm your AI assistant. How can I help you today?"
        };

        ws.send(JSON.stringify(settings));
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Audio data
          const arrayBuffer = await event.data.arrayBuffer();
          processAudioData(arrayBuffer);
        } else {
          // JSON message
          try {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error occurred');
        disconnect();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsConnecting(false);
      };

    } catch (err) {
      console.error('Error connecting:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  };

  const handleServerMessage = (message: any) => {
    switch (message.type) {
      case 'SettingsApplied':
        console.log('Settings applied successfully');
        setIsConnecting(false);
        setIsConnected(true);
        startAudioCapture();
        
        // Start keep-alive interval (every 5 seconds)
        keepAliveIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'KeepAlive' }));
          }
        }, 5000);
        break;

      case 'ConversationText':
        const newMessage: ConversationMessage = {
          id: Date.now().toString(),
          role: message.role === 'user' ? 'user' : 'agent',
          text: message.text,
          timestamp: new Date()
        };
        setConversation(prev => [...prev, newMessage]);
        
        if (message.role === 'user') {
          setCurrentTranscript('');
        }
        break;

      case 'UserStartedSpeaking':
        console.log('User started speaking');
        setIsUserSpeaking(true);
        // Clear audio queue when user interrupts
        audioQueueRef.current = [];
        if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current = null;
        }
        setIsAgentSpeaking(false);
        break;

      case 'AgentThinking':
        console.log('Agent is thinking...');
        break;

      case 'AgentStartedSpeaking':
        console.log('Agent started speaking');
        setIsUserSpeaking(false);
        break;

      case 'AgentAudioDone':
        console.log('Agent finished speaking');
        break;

      case 'Error':
        console.error('Agent error:', message);
        setError(message.message || 'An error occurred');
        break;

      case 'Warning':
        console.warn('Agent warning:', message);
        break;
    }
  };

  const startAudioCapture = () => {
    if (!mediaStreamRef.current || !audioContextRef.current || !wsRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
    const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
    audioProcessorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (!isMuted && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Send audio data
        wsRef.current.send(int16Data.buffer);
      }
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };

  const disconnect = () => {
    cleanup();
    setIsConnected(false);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    setCurrentTranscript('');
  };

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    
    // Stop current audio if muting
    if (!isSpeakerMuted && sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
      audioQueueRef.current = [];
      setIsAgentSpeaking(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Deepgram Voice Agent (Speech-to-Speech)
          </h1>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Control Panel */}
          <div className="flex justify-center gap-4 mb-8">
            {/* Main Connection Button */}
            <button
              onClick={toggleConnection}
              disabled={isConnecting}
              className={`
                relative p-6 rounded-full transition-all duration-300 transform
                ${isConnected 
                  ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg' 
                  : 'bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg'
                }
                ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                text-white
              `}
            >
              {isConnecting ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isConnected ? (
                <>
                  <PhoneOff className="w-10 h-10" />
                  <span className="absolute -inset-1 rounded-full bg-red-500 animate-ping opacity-75"></span>
                </>
              ) : (
                <Phone className="w-10 h-10" />
              )}
            </button>

            {/* Mute/Unmute Button */}
            {isConnected && (
              <>
                <button
                  onClick={toggleMute}
                  className={`
                    p-4 rounded-full transition-all duration-300
                    ${isMuted 
                      ? 'bg-gray-500 hover:bg-gray-600' 
                      : 'bg-blue-500 hover:bg-blue-600'
                    }
                    text-white shadow-md hover:shadow-lg hover:scale-105
                  `}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {/* Speaker Mute/Unmute Button */}
                <button
                  onClick={toggleSpeaker}
                  className={`
                    p-4 rounded-full transition-all duration-300
                    ${isSpeakerMuted 
                      ? 'bg-gray-500 hover:bg-gray-600' 
                      : 'bg-purple-500 hover:bg-purple-600'
                    }
                    text-white shadow-md hover:shadow-lg hover:scale-105
                  `}
                >
                  {isSpeakerMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>

          <p className="text-center text-gray-600 mb-8">
            {isConnecting ? 'Connecting to voice agent...' : 
             isConnected ? (isMuted ? 'Microphone muted' : 'Voice agent is listening...') : 
             'Click to start voice conversation'}
          </p>

          {/* Status Indicators */}
          {isConnected && (
            <div className="flex justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isUserSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600">You're speaking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isAgentSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600">Agent is speaking</span>
              </div>
            </div>
          )}

          {/* Conversation Display */}
          <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Conversation</h2>
              {conversation.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {conversation.length === 0 ? (
              <p className="text-gray-400 text-center mt-16">
                Your conversation will appear here...
              </p>
            ) : (
              <div className="space-y-3">
                {conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[80%] p-4 rounded-lg shadow-sm
                        ${message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                        }
                      `}
                    >
                      <p className="text-sm font-medium mb-1">
                        {message.role === 'user' ? 'You' : 'Agent'}
                      </p>
                      <p>{message.text}</p>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {currentTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-4 rounded-lg bg-blue-100 text-blue-800 italic">
                      <p className="text-sm">{currentTranscript}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected to Deepgram Voice Agent' : 'Not connected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepgramVoiceAgent;