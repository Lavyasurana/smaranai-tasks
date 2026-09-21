// Vercel Serverless Function: /api/chat-gemini
// Connects securely to Google Gemini REST API without leaking GEMINI_API_KEY to browser

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      endpoint: '/api/chat-gemini',
      runtime: 'Vercel Serverless Function',
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables. Please set GEMINI_API_KEY in your Vercel Project Settings → Environment Variables.'
      });
    }

    const {
      messages = [],
      model = 'gemini-3.5-flash-lite',
      systemInstruction = 'You are a helpful and knowledgeable Full-Stack AI assistant specializing in Supabase, Node.js, and React.',
      temperature = 0.7,
    } = req.body || {};

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'messages array cannot be empty' });
    }

    const geminiContents = messages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

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
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
    ])).filter(Boolean);

    let lastError = null;
    let geminiData = null;
    let usedModel = model;

    for (const currentModel of candidateModels) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(currentModel)}:generateContent?key=${key}`;
        const geminiRes = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        const data = await geminiRes.json();
        if (geminiRes.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          geminiData = data;
          usedModel = currentModel;
          break;
        } else {
          lastError = data.error?.message || `HTTP ${geminiRes.status}`;
          console.warn(`[Gemini API] Model ${currentModel} returned: ${lastError}. Trying fallback model...`);
        }
      } catch (err) {
        lastError = err.message;
        console.warn(`[Gemini API] Model ${currentModel} fetch failed: ${err.message}. Trying fallback...`);
      }
    }

    if (!geminiData) {
      return res.status(503).json({
        error: `Gemini API service temporarily busy: ${lastError}`,
      });
    }

    const reply = geminiData.candidates[0].content.parts[0].text;
    return res.status(200).json({
      reply,
      model: usedModel,
      usage: geminiData.usageMetadata,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
