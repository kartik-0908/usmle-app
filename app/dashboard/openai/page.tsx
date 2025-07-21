"use client";
import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { RealtimeSession } from "@openai/agents/realtime";
import { getTempToken } from "@/app/actions/openai";
import { AIVoiceAnimation } from "@/components/voice-animation";

const RealtimeVoiceAgent = ({
  question,
  options,
  explanation,
}: {
  question: string;
  options?: string[];
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

        const systemPrompt = `You are an AI study assistant helping a student understand a practice question. 

Question Details:
- Question: ${question}
- Options: ${options?.join(", ") || "N/A"}

Explanation: ${explanation}

You are  provided with the correct answer and its clinical/scientific explanation for a USMLE question.
 Your task is to simplify the conceptual approach and break it down into small, logical steps.
 Reveal each step one at a time, actively engaging the user by asking them what they think the next step is. This way, the learning process becomes interactive and helps reinforce their understanding.

Step 1: What’s happening to the patient right now?
He presented with signs of an acute STEMI (ST elevations in V2–V4 = anteroseptal infarct).


After receiving nitroglycerin, he crashes:
 ↓ BP (82/54 mmHg), ↑ HR (120 bpm), cold/clammy → hemodynamic collapse/shock.



Step 2: What type of shock is this?
In the setting of an MI + hypotension + signs of poor perfusion (clammy, tachycardia), think cardiogenic shock.


But this might also be nitrate-induced hypotension due to venodilation → reduced preload.



Step 3: First-line response to this scenario?
In a hypotensive patient, the priority is to restore perfusion:


Rule out fluid-responsive causes (e.g., nitro-induced hypotension or underfilled RV).


Give a normal saline bolus (Option C) first to increase preload and raise BP.



Step 4: When do we consider inotropes like dopamine?
Only after fluids fail and the patient is still in cardiogenic shock (e.g., persistent hypotension, low cardiac output signs like altered mental status or oliguria).



Step 5: Why not dopamine first?
It has dose-dependent effects:


Low: dopaminergic (renal perfusion – mostly irrelevant here)


Medium: β1 → increases heart rate and contractility


High: α1 → vasoconstriction


Sounds good on paper… but here’s the catch:


↑ HR = ↑ myocardial oxygen demand → bad for ischemic myocardium!


Risk of tachyarrhythmias – especially dangerous in someone post-MI


Evidence shows dopamine is associated with worse outcomes (↑ mortality, ↑ arrhythmias) vs. alternatives.



Step 6: What would be better than dopamine?
If you need pressors after fluid bolus:


Dobutamine → inotrope with less tachycardia


Norepinephrine → vasopressor that preserves perfusion pressure without jacking up heart rate as much



Step 7: Bottom line?
Too early and too risky to start dopamine.


First, try fluids (Option C). If that fails, choose safer inotropes/pressors.


Dopamine = Plan C, not Plan A.



Your role:
1. Help the student understand the question and related concepts
2. Provide hints and explanations without giving away the answer directly (unless they've already answered)
3. Break down complex concepts into simpler terms
4. Provide additional context and examples related to the topic
5. Encourage critical thinking and learning
6. Be supportive and encouraging

Guidelines:
- If the student hasn't answered yet, don't reveal the correct answer
- Focus on teaching concepts rather than just giving answers
- Use examples and analogies to explain difficult concepts
- Be encouraging and positive
- Ask follow-up questions to check understanding
- If they got it wrong, help them understand why and learn from the mistake`;

        agentRef.current = new RealtimeAgent({
          name: "Assistant",
          instructions:systemPrompt,
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

          {/* <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Audio Active</span>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default RealtimeVoiceAgent;
