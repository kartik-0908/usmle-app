'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, AlertCircle } from 'lucide-react';
import { RealtimeSession } from '@openai/agents/realtime';

const RealtimeVoiceAgent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [apiKey, setApiKey] = useState('');
  const [ephemeralToken, setEphemeralToken] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState<any>(null);
  const [useExternalToken, setUseExternalToken] = useState(false);
  const [externalToken, setExternalToken] = useState('');
  
  const sessionRef = useRef<any>(null);
  const agentRef = useRef<any>(null);

  // Initialize the agent
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        // Note: In a real implementation, you would import from '@openai/agents/realtime'
        // For this demo, we're simulating the API structure
        const { RealtimeAgent, RealtimeSession } = await import('@openai/agents/realtime');
        
        agentRef.current = new RealtimeAgent({
          name: 'Assistant',
          instructions: 'You are a helpful voice assistant. Be concise and conversational in your responses.',
          voice: 'alloy', // You can change this to other available voices
        });

        // Set up event listeners
        agentRef.current.on('response.audio_transcript.delta', (event: any) => {
          console.log('Assistant speaking:', event.delta);
        });

        agentRef.current.on('conversation.item.input_audio_transcription.completed', (event: any) => {
          console.log('User said:', event.transcript);
        });

      } catch (err) {
        console.log('Note: This is a demo component. In production, install @openai/agents');
        setError('OpenAI agents library not available in this environment');
      }
    };

    initializeAgent();
  }, []);

  // Generate ephemeral token for secure browser connection
  const generateEphemeralToken = async () => {
    if (!apiKey.trim()) {
      throw new Error('API key is required');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-realtime-preview-2024-12-17',
          voice: 'alloy', // You can change this to: alloy, echo, fable, onyx, nova, shimmer
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setEphemeralToken(data.client_secret.value);
      setTokenExpiry(new Date(data.client_secret.expires_at * 1000));
      return data.client_secret.value;
    } catch (error: any) {
      throw new Error(`Failed to generate ephemeral token: ${error.message}`);
    }
  };

  const connectToAgent = async () => {
    let token;

    if (useExternalToken) {
      if (!externalToken.trim()) {
        setError('Please enter an ephemeral token');
        return;
      }
      token = externalToken.trim();
      setStatus('Connecting with external token...');
    } else {
      if (!apiKey.trim()) {
        setError('Please enter your OpenAI API key');
        return;
      }
      setStatus('Generating secure token...');
      try {
        token = await generateEphemeralToken();
      } catch (err: any) {
        setError(`Failed to generate token: ${err.message}`);
        return;
      }
    }

    setIsConnecting(true);
    setError('');
    setStatus('Connecting to voice agent...');

    try {
      // Note: In production, this would use the actual OpenAI agents library
      if (!agentRef.current) {
        throw new Error('Agent not initialized');
      }

      sessionRef.current = new RealtimeSession(agentRef.current);
      
      // Connect with WebRTC using ephemeral token
      await sessionRef.current.connect({
        apiKey: token, // Use ephemeral token
        useInsecureApiKey: false, // This is secure with ephemeral token
      });

      setIsConnected(true);
      setStatus('Connected - Speak to interact');
      
      // Set up session event listeners
      sessionRef.current.on('connected', () => {
        setStatus('Connected and ready');
      });

      sessionRef.current.on('disconnected', () => {
        setIsConnected(false);
        setStatus('Disconnected');
        if (!useExternalToken) {
          setEphemeralToken('');
          setTokenExpiry(null);
        }
      });

      sessionRef.current.on('error', (error: any) => {
        setError(`Connection error: ${error.message}`);
        setIsConnected(false);
        setStatus('Error occurred');
      });

    } catch (err: any) {
      setError(`Failed to connect: ${err.message}`);
      setStatus('Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromAgent = async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.disconnect();
        sessionRef.current = null;
      } catch (err) {
        console.error('Error disconnecting:', err);
      }
    }
    setIsConnected(false);
    setStatus('Disconnected');
  };

  const toggleMute = async () => {
    if (sessionRef.current && isConnected) {
      try {
        if (isMuted) {
          await sessionRef.current.startRecording();
        } else {
          await sessionRef.current.stopRecording();
        }
        setIsMuted(!isMuted);
      } catch (err: any) {
        setError(`Failed to toggle mute: ${err.message}`);
      }
    }
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isConnected) return 'text-green-600';
    if (isConnecting) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getConnectionButtonColor = () => {
    if (isConnected) return 'bg-red-500 hover:bg-red-600';
    return 'bg-green-500 hover:bg-green-600';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Voice Assistant
        </h1>
        <p className="text-gray-600">OpenAI Realtime Agent</p>
      </div>

      

      {/* API Key Input */}
      {!isConnected && !useExternalToken && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used to generate secure ephemeral tokens for browser connection
          </p>
        </div>
      )}

      {/* External Token Input */}
      {!isConnected && useExternalToken && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ephemeral Token
          </label>
          <input
            type="password"
            value={externalToken}
            onChange={(e) => setExternalToken(e.target.value)}
            placeholder="client_secret.value from API response..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ephemeral token generated via cURL or backend API call
          </p>
        </div>
      )}

      {/* Token Status */}
      {(ephemeralToken || (useExternalToken && externalToken)) && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm font-medium text-green-800">
            {useExternalToken ? 'External Token Ready' : 'Secure Token Generated'}
          </div>
          {tokenExpiry && (
            <div className="text-xs text-green-600 mt-1">
              Expires: {tokenExpiry.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Status Display */}
      <div className="mb-6 text-center">
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {status}
        </div>
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Connection Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={isConnected ? disconnectFromAgent : connectToAgent}
          disabled={isConnecting}
          className={`flex items-center gap-2 px-6 py-3 ${getConnectionButtonColor()} text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <PhoneOff className="w-4 h-4" />
              Disconnect
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Connect
            </>
          )}
        </button>
      </div>

      {/* Voice Controls */}
      {isConnected && (
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="w-4 h-4" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Mute
              </>
            )}
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Audio Active</span>
          </div>
        </div>
      )}

    
    </div>
  );
};

export default RealtimeVoiceAgent;