// app/api/voice-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
} from "@google/genai";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

class VoiceAgent {
  private responseQueue: LiveServerMessage[] = [];
  private session: Session | undefined = undefined;
  private audioParts: string[] = [];
  private responseText: string = "";
  private audioFilePath: string = "";

  async handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    let done = false;
    while (!done) {
      const message = await this.waitMessage();
      turn.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turn;
  }

  async waitMessage(): Promise<LiveServerMessage> {
    let done = false;
    let message: LiveServerMessage | undefined = undefined;
    while (!done) {
      message = this.responseQueue.shift();
      if (message) {
        this.handleModelTurn(message);
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message!;
  }

  handleModelTurn(message: LiveServerMessage) {
    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent?.modelTurn?.parts?.[0];

      if (part?.fileData) {
        console.log(`File: ${part?.fileData.fileUri}`);
      }

      if (part?.inlineData) {
        const fileName = `audio-${randomUUID()}.wav`;
        const inlineData = part?.inlineData;

        this.audioParts.push(inlineData?.data ?? "");

        const buffer = this.convertToWav(
          this.audioParts,
          inlineData.mimeType ?? ""
        );
        this.audioFilePath = join(process.cwd(), "public", "temp", fileName);
        this.saveBinaryFile(this.audioFilePath, buffer);
      }

      if (part?.text) {
        this.responseText += part?.text;
      }
    }
  }

  async saveBinaryFile(fileName: string, content: Buffer) {
    try {
      // Ensure temp directory exists
      const tempDir = join(process.cwd(), "public", "temp");
      await writeFile(fileName, content);
      console.log(`Audio saved to: ${fileName}`);
    } catch (err) {
      console.error(`Error writing file ${fileName}:`, err);
    }
  }

  convertToWav(rawData: string[], mimeType: string) {
    const options = this.parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = this.createWavHeader(dataLength, options);
    const buffer = Buffer.concat(
      rawData.map((data) => Buffer.from(data, "base64"))
    );

    return Buffer.concat([wavHeader, buffer]);
  }

  parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
    const [_, format] = fileType.split("/");

    const options: Partial<WavConversionOptions> = {
      numChannels: 1,
      bitsPerSample: 16,
      sampleRate: 16000, // Default sample rate
    };

    if (format && format.startsWith("L")) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split("=").map((s) => s.trim());
      if (key === "rate") {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return options as WavConversionOptions;
  }

  createWavHeader(dataLength: number, options: WavConversionOptions) {
    const { numChannels, sampleRate, bitsPerSample } = options;

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write("RIFF", 0); // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    buffer.write("WAVE", 8); // Format
    buffer.write("fmt ", 12); // Subchunk1ID
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22); // NumChannels
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(byteRate, 28); // ByteRate
    buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
    buffer.write("data", 36); // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

    return buffer;
  }

  async processAudio(
    audioBuffer: Buffer
  ): Promise<{ text: string; audioUrl?: string }> {
    try {
      // Initialize Google AI
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
      const model = "models/gemini-2.5-flash-live-preview";

      const config = {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Zephyr",
            },
          },
        },
        contextWindowCompression: {
          triggerTokens: "25600",
          slidingWindow: { targetTokens: "12800" },
        },
      };

      // Create session
      this.session = await ai.live.connect({
        model,
        callbacks: {
          onopen: () => console.log("Session opened"),
          onmessage: (message: LiveServerMessage) => {
            this.responseQueue.push(message);
          },
          onerror: (e: ErrorEvent) =>
            console.error("Session error:", e.message),
          onclose: (e: CloseEvent) => console.log("Session closed:", e.reason),
        },
        config,
      });

      // Convert audio to base64 for Gemini
      const audioBase64 = audioBuffer.toString("base64");

      // Send audio content
      this.session.sendClientContent({
        turns: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/webm",
                  data: audioBase64,
                },
              },
            ],
          },
        ],
      });

      // Wait for response
      await this.handleTurn();

      // Close session
      this.session.close();

      // Return response
      const audioUrl = this.audioFilePath
        ? `/temp/${this.audioFilePath.split("/").pop()}`
        : undefined;

      return {
        text:
          this.responseText ||
          "I received your message but couldn't generate a text response.",
        audioUrl,
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      throw new Error("Failed to process audio with Gemini API");
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API key not configured");
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      console.error("No audio file provided");
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert audio file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Process with voice agent
    const voiceAgent = new VoiceAgent();
    const result = await voiceAgent.processAudio(audioBuffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
