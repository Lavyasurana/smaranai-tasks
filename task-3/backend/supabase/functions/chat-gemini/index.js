// Supabase Edge Function: chat-gemini
// Connects securely to the Google Gemini API using Node.js / Edge JavaScript runtime

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey =
      (typeof Deno !== "undefined" ? Deno.env.get("GEMINI_API_KEY") : null) ||
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured on the server/edge environment. Please set GEMINI_API_KEY in task-3/backend/.env or Supabase Secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      messages = [],
      model = "gemini-3.5-flash-lite",
      systemInstruction = "You are a helpful and knowledgeable Full-Stack AI assistant specializing in Supabase, Node.js, and React.",
      temperature = 0.7,
    } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format conversation history for Gemini API
    const geminiContents = messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content || m.text || "" }],
    }));

    // Construct Gemini REST API payload
    const requestPayload = {
      contents: geminiContents,
      generationConfig: {
        temperature: parseFloat(temperature) || 0.7,
        maxOutputTokens: 2048,
      },
    };

    if (systemInstruction) {
      requestPayload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const candidateModels = Array.from(new Set([
      model,
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.6-flash",
    ])).filter(Boolean);

    let lastError = null;
    let geminiData = null;
    let usedModel = model;

    for (const currentModel of candidateModels) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          currentModel
        )}:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });

        const data = await geminiRes.json();
        if (geminiRes.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          geminiData = data;
          usedModel = currentModel;
          break;
        } else {
          lastError = data.error?.message || `HTTP ${geminiRes.status}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!geminiData) {
      return new Response(
        JSON.stringify({ error: `Gemini API service temporarily busy: ${lastError}` }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract text from Gemini response candidate
    const candidate = geminiData.candidates?.[0];
    const replyText =
      candidate?.content?.parts?.map((p) => p.text).join("") || "No response generated.";

    return new Response(
      JSON.stringify({
        success: true,
        model: usedModel,
        reply: replyText,
        finishReason: candidate?.finishReason || "STOP",
        usageMetadata: geminiData.usageMetadata || null,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(handler);
}
