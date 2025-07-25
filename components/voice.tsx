"use client";
import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { RealtimeSession } from "@openai/agents/realtime";
import { getTempToken } from "@/app/actions/openai";
import { AIVoiceAnimation } from "@/components/voice-animation";
import { getVoicePrompt } from "@/lib/ai/prompt";

const RealtimeVoiceAgent = ({
  question,
  options,
  explanation,
}: {
  question: string;
  options: string[];
  explanation: string;
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const sessionRef = useRef<any>(null);
  const agentRef = useRef<any>(null);

  // Initialize the agent
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        // Note: In a real implementation, you would import from '@openai/agents/realtime'
        // For this demo, we're simulating the API structure
        const { RealtimeAgent } = await import("@openai/agents/realtime");

        agentRef.current = new RealtimeAgent({
          name: "Assistant",
          instructions: getVoicePrompt(question, options, explanation),
          voice: "alloy", // You can change this to other available voices
        });

        // Set up event listeners
        agentRef.current.on("response.audio_transcript.delta", (event: any) => {
          console.log("Assistant speaking:", event.delta);
        });

        agentRef.current.on(
          "conversation.item.input_audio_transcription.completed",
          (event: any) => {
            console.log("User said:", event.transcript);
          }
        );
      } catch (err) {
        console.log(
          "Note: This is a demo component. In production, install @openai/agents"
        );
      }
    };

    initializeAgent();
  }, []);

  // Generate ephemeral token for secure browser connection
  const generateEphemeralToken = async () => {
    try {
      const { token, expiry } = await getTempToken();
      return token;
    } catch (error: any) {
      throw new Error(`Failed to generate ephemeral token: ${error.message}`);
    }
  };

  const connectToAgent = async () => {
    let token;

    try {
      token = await generateEphemeralToken();
    } catch (err: any) {
      return;
    }

    setIsConnecting(true);

    try {
      // Note: In production, this would use the actual OpenAI agents library
      if (!agentRef.current) {
        throw new Error("Agent not initialized");
      }

      sessionRef.current = new RealtimeSession(agentRef.current);

      // Connect with WebRTC using ephemeral token
      await sessionRef.current.connect({
        apiKey: token, // Use ephemeral token
        useInsecureApiKey: false, // This is secure with ephemeral token
      });

      setIsConnected(true);

      // Set up session event listeners
      sessionRef.current.on("connected", () => {});

      sessionRef.current.on("disconnected", () => {
        setIsConnected(false);
      });

      sessionRef.current.on("error", (error: any) => {
        setIsConnected(false);
      });
    } catch (err: any) {
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromAgent = async () => {
    if (sessionRef.current) {
      try {
        await sessionRef.current.close();
        sessionRef.current = null;
      } catch (err) {
        console.error("Error disconnecting:", err);
      }
    }
    setIsConnected(false);
    // setStatus("Disconnected");
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
        // setError(`Failed to toggle mute: ${err.message}`);
      }
    }
  };

  // const getConnectionButtonColor = () => {
  //   if (isConnected) return "bg-red-500 hover:bg-red-600";
  //   return "bg-green-500 hover:bg-green-600";
  // };

  return (
    <div className="w-full h-full mx-auto p-6 bg-red rounded-lg shadow-lg">
      {/* Connection Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={isConnected ? disconnectFromAgent : connectToAgent}
          disabled={isConnecting}
          className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnecting ? (
            <AIVoiceAnimation status="connecting" size="xl" />
          ) : isConnected ? (
            <AIVoiceAnimation status="active" size="xl" />
          ) : (
            <AIVoiceAnimation status="inactive" size="xl" />
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
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
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
        </div>
      )}
    </div>
  );
};

export default RealtimeVoiceAgent;
