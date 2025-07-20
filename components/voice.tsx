'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, Square } from 'lucide-react';

interface AudioMessage {
  id: string;
  type: 'user' | 'ai';
  text?: string;
  audioUrl?: string;
  timestamp: Date;
}

export default function VoiceAgent() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const sessionActiveRef = useRef<boolean>(false); // Track if session should continue

  // Voice Activity Detection settings
  const SILENCE_THRESHOLD = 5; // Lowered threshold for better sensitivity
  const SILENCE_DURATION = 500; // 1.5 seconds of silence
  const MIN_SPEECH_DURATION = 300; // 0.3 seconds
  const VAD_CHECK_INTERVAL = 50; // Check every 50ms

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting recording session...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      sessionActiveRef.current = true;

      // Set up Web Audio API for voice activity detection
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.3;
      analyser.minDecibels = -60;
      analyser.maxDecibels = -10;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Modified: Don't stop the session when MediaRecorder stops
      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing current audio...');
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await sendAudioToAPI(audioBlob);
          
          // Clear chunks for next recording if session is still active
          if (sessionActiveRef.current) {
            audioChunksRef.current = [];
            // Restart recording for continuous session
            startContinuousRecording();
          }
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      isRecordingRef.current = true;
      lastSpeechTimeRef.current = 0;

      // Start voice activity detection
      setTimeout(() => {
        startVoiceActivityDetection();
      }, 100);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, []);

  // New function to restart recording for continuous session
  const startContinuousRecording = useCallback(() => {
    if (!streamRef.current || !sessionActiveRef.current) return;
    
    console.log('Restarting recording for continuous session...');
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'audio/webm;codecs=opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log('MediaRecorder stopped in continuous mode...');
      if (audioChunksRef.current.length > 0 && sessionActiveRef.current) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToAPI(audioBlob);
        
        // Clear chunks and restart if session is still active
        audioChunksRef.current = [];
        if (sessionActiveRef.current) {
          startContinuousRecording();
        }
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    lastSpeechTimeRef.current = 0;
  }, []);

  const startVoiceActivityDetection = useCallback(() => {
    if (!analyserRef.current) {
      console.log('No analyser available for VAD');
      return;
    }

    console.log('Starting voice activity detection...');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    vadIntervalRef.current = setInterval(() => {
      if (!analyserRef.current || !sessionActiveRef.current) {
        console.log('VAD stopped - no analyser or session ended');
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume focusing on speech frequencies
      let sum = 0;
      let count = 0;
      
      const minBin = Math.floor(300 * bufferLength / (audioContextRef.current?.sampleRate || 44100));
      const maxBin = Math.floor(3000 * bufferLength / (audioContextRef.current?.sampleRate || 44100));
      
      for (let i = minBin; i < maxBin && i < bufferLength; i++) {
        sum += dataArray[i];
        count++;
      }
      
      const average = count > 0 ? sum / count : 0;
      const volume = (average / 255) * 100;
      
      setVolumeLevel(volume);

      const currentTime = Date.now();
      const isSpeaking = volume > SILENCE_THRESHOLD;

      if (isSpeaking) {
        // Voice detected
        setIsListening(true);
        lastSpeechTimeRef.current = currentTime;
        
        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else {
        // Silence detected
        setIsListening(false);
        
        // Start silence timer if we had speech and no timer is running
        if (lastSpeechTimeRef.current > 0 && 
            !silenceTimerRef.current && 
            sessionActiveRef.current &&
            (currentTime - lastSpeechTimeRef.current) > MIN_SPEECH_DURATION) {
          
          console.log('Starting silence timer...');
          silenceTimerRef.current = setTimeout(() => {
            console.log('Silence timeout reached, processing audio chunk...');
            if (sessionActiveRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              // Stop current recording to process audio, but keep session active
              mediaRecorderRef.current.stop();
            }
          }, SILENCE_DURATION);
        }
      }
    }, VAD_CHECK_INTERVAL);
  }, []);

  // Modified stop function - this now ends the entire session
  const stopRecording = useCallback(() => {
    console.log('Ending recording session...');
    
    sessionActiveRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    isRecordingRef.current = false;
    setIsListening(false);
    setVolumeLevel(0);
    
    // Clean up all resources
    cleanupAudio();
  }, []);

  const cleanupAudio = useCallback(() => {
    console.log('Cleaning up audio resources...');
    
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
    lastSpeechTimeRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const toggleRecording = useCallback(() => {
    if (isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, isProcessing, startRecording, stopRecording]);

  const sendAudioToAPI = async (audioBlob: Blob) => {
    console.log('Sending audio to API, blob size:', audioBlob.size);
    
    // Don't set processing state to true as we want to continue listening
    // Only show processing indicator if it's the first message or user specifically requested
    const showProcessing = messages.length === 0 || !sessionActiveRef.current;
    if (showProcessing) {
      setIsProcessing(true);
    }
    
    // Add user message
    const userMessage: AudioMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: 'Voice message recorded',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process audio');
      }

      const result = await response.json();
      console.log('API response:', result);
      
      // Add AI response
      const aiMessage: AudioMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: result.text,
        audioUrl: result.audioUrl,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Auto-play AI response
      if (result.audioUrl) {
        playAudio(result.audioUrl);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      const errorMessage: AudioMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      if (showProcessing) {
        setIsProcessing(false);
      }
    }
  };

  const playAudio = (audioUrl: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
    }

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });

    audio.onended = () => {
      setCurrentAudio(null);
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <h1 className="text-2xl font-bold text-white text-center">
          🎤 Voice AI Agent
        </h1>
        <p className="text-white/70 text-center mt-1">
          Powered by Google Gemini Live API
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/60 mt-20">
            <Volume2 className="mx-auto mb-4" size={48} />
            <p className="text-lg">Start a conversation with your voice</p>
            <p className="text-sm mt-2">Click to start continuous conversation</p>
            <p className="text-xs mt-1 opacity-70">The session will keep running until you press stop</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              
              {message.audioUrl && (
                <button
                  onClick={() => playAudio(message.audioUrl!)}
                  className="flex items-center gap-2 mt-2 text-xs opacity-80 hover:opacity-100 transition-opacity"
                >
                  <Volume2 size={14} />
                  Play Audio
                </button>
              )}
              
              <p className="text-xs opacity-60 mt-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-3 rounded-2xl max-w-xs">
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <p className="text-sm">AI is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center">
            <button
              onClick={toggleRecording}
              disabled={isProcessing && messages.length === 0}
              className={`p-6 rounded-full transition-all duration-200 ${
                isRecording
                  ? isListening 
                    ? 'bg-green-500 scale-110 shadow-lg shadow-green-500/50'
                    : 'bg-yellow-500 scale-110 shadow-lg shadow-yellow-500/50'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30'
              } ${
                (isProcessing && messages.length === 0) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {(isProcessing && messages.length === 0) ? (
                <Loader2 className="text-white animate-spin" size={32} />
              ) : isRecording ? (
                <Square className="text-white" size={32} />
              ) : (
                <Mic className="text-white" size={32} />
              )}
            </button>
          </div>
          
          {/* Volume indicator */}
          {isRecording && (
            <div className="mt-4">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(100, volumeLevel)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="text-center mt-4">
            <p className="text-white/80 text-sm">
              {(isProcessing && messages.length === 0)
                ? 'Processing your message...'
                : isRecording
                ? isListening
                  ? 'Listening... Keep talking'
                  : 'Waiting for you to speak...'
                : 'Click to start continuous conversation'
              }
            </p>
          </div>
          
          {isRecording && (
            <>
              <div className="text-center mt-2">
                <p className={`text-xs flex items-center justify-center gap-1 ${
                  isListening ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isListening ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                  }`}></div>
                  {isListening ? `Voice detected (${Math.round(volumeLevel)}%)` : 'Listening for voice...'}
                </p>
              </div>
              
              <div className="text-center mt-1">
                <p className="text-white/60 text-xs">
                  Session active - Click stop to end conversation
                </p>
              </div>
            </>
          )}
          
          {currentAudio && (
            <div className="text-center mt-2">
              <p className="text-green-400 text-xs flex items-center justify-center gap-1">
                <Volume2 size={12} />
                Playing AI response...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}