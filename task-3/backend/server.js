import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.TASK3_PORT || 54323;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    task: 'task-3',
    runtime: `Node.js ${process.version}`,
    geminiKeyConfigured: Boolean(apiKey && apiKey !== 'your-gemini-api-key-here')
  });
});

// Emulated Edge Function endpoint: /functions/v1/chat-gemini
app.post('/functions/v1/chat-gemini', async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY || apiKey;
    if (!key || key === 'your-gemini-api-key-here') {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in task-3/backend/.env. Please add your Gemini API key to start chatting.'
      });
    }

    const {
      messages = [],
      model = 'gemini-3.5-flash-lite',
      systemInstruction = 'You are a helpful and knowledgeable Full-Stack AI assistant specializing in Supabase, Node.js, and React.',
      temperature = 0.7
    } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'messages array cannot be empty' });
    }

    const geminiContents = messages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }]
    }));

    const requestPayload = {
      contents: geminiContents,
      generationConfig: {
        temperature: parseFloat(temperature) || 0.7,
        maxOutputTokens: 2048,
      }
    };

    if (systemInstruction) {
      requestPayload.systemInstruction = {
        parts: [{ text: systemInstruction }]
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
          body: JSON.stringify(requestPayload)
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
        error: `Gemini API service temporarily busy: ${lastError}`
      });
    }

    const candidate = geminiData.candidates?.[0];
    const replyText = candidate?.content?.parts?.map((p) => p.text).join('') || 'No response generated.';

    return res.json({
      success: true,
      model: usedModel,
      reply: replyText,
      finishReason: candidate?.finishReason || 'STOP',
      usageMetadata: geminiData.usageMetadata || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Task-3 Backend] Gemini Edge Function runner listening at http://localhost:${PORT}`);
});
