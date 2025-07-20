import { NextRequest, NextResponse } from 'next/server';

interface EphemeralTokenResponse {
  client_secret: {
    value: string;
    expires_at: number;
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-realtime-preview-2025-06-03';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        voice: process.env.OPENAI_VOICE || 'alloy',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: EphemeralTokenResponse = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate ephemeral token: ${error.message}` },
      { status: 500 }
    );
  }
}