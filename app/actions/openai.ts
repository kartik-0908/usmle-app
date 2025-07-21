'use server'
export async function getTempToken() {

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
          voice: "alloy", // You can change this to: alloy, echo, fable, onyx, nova, shimmer
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    return {
      token: data.client_secret.value,
      expiry: data.client_secret.expires_at,
    };
  } catch (error) {
    console.error("Error generating ephemeral token:", error);
    throw new Error(`Failed to generate ephemeral token: ${error}`);
  }
}
