# Task 3: FS-GenAI Chatbot (Gemini API via Supabase Edge Function)

A full-stack Generative AI application featuring:
- **React Frontend (JSX + Vite)**: Modern AI chatbot interface with Markdown code highlighting, prompt presets, dynamic model selection, and latency/token stats.
- **Supabase Edge Function (`chat-gemini`)**: JavaScript serverless Edge Function that communicates with Google's Gemini API (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest`, `gemini-3.6-flash`), formats multi-turn chat history, and securely safeguards API keys on the server.
- **Pure Supabase Backend (Zero Express)**: Supabase Edge Functions are the ONLY backend used across the project. No Express or third-party web frameworks are used. A lightweight native Node.js HTTP runner is included solely for local testing without requiring Deno.

---

## Folder Structure

```
task-3/
├── supabase/
│   └── functions/chat-gemini/index.js        # Official Supabase Edge Function
├── backend/
│   ├── supabase/functions/chat-gemini/       # Supabase Edge Function handler
│   ├── server.js                             # Zero-Express native runner for local testing
│   ├── package.json                          # Zero Express dependencies (dotenv only)
│   ├── .env.example
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/                       # ChatHeader, ChatMessage, ChatInput
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example
    └── .env
```

---

## Quick Start

### 1. Get a Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com).
2. Click **Get API key** → **Create API key**.
3. Copy your API key.

### 2. Configure Environment Variables
- **Backend** (`backend/.env`):
  ```env
  GEMINI_API_KEY=AIzaSy...your-gemini-key
  PORT=54323
  ```
- **Frontend** (`frontend/.env`):
  ```env
  VITE_EDGE_FUNCTION_URL=http://localhost:54323/functions/v1/chat-gemini
  ```

*(You can also customize the Edge Function URL, model selection, temperature, and system prompt directly in the frontend UI by clicking "Settings".)*

### 3. Run the Supabase Edge Function Backend
You have two options to run the Supabase Function backend:

**Option A: Via Official Supabase CLI (Recommended)**
```bash
supabase functions serve chat-gemini --no-verify-jwt
```
Runs at `http://localhost:54321/functions/v1/chat-gemini`.

**Option B: Via Native Zero-Express Runner**
```bash
cd task-3/backend
npm install
npm start
```
Runs at `http://localhost:54323/functions/v1/chat-gemini` (uses native `node:http`, zero Express).

### 4. Run the Frontend (React + Vite)
```bash
cd task-3/frontend
npm install
npm run dev
```
Runs at `http://localhost:3003`.

---

## Features
- **Secure Backend Integration**: The frontend never exposes `GEMINI_API_KEY`. All LLM communication is routed through the Supabase Edge Function.
- **Multi-Turn Chat**: Maintains conversation history (`user` & `model` roles) for contextual follow-up questions.
- **Markdown & Code Rendering**: Previews formatted code blocks with a 1-click copy button, bulleted lists, and bold text.
- **Model Flexibility**: Seamlessly toggle between `gemini-2.5-flash`, `gemini-1.5-flash`, and `gemini-1.5-pro`.
- **System Prompts & Temperature**: Customize the assistant persona and creativity level in the Settings dialog.
