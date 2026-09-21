# Task 3: FS-GenAI Chatbot (Gemini API via Supabase Edge Function)

A full-stack Generative AI application featuring:
- **React Frontend (JSX + Vite)**: Modern AI chatbot interface with Markdown code highlighting, prompt presets, dynamic model selection, and latency/token stats.
- **Supabase Edge Function (`chat-gemini`)**: JavaScript serverless Edge Function that communicates with Google's Gemini API (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`), formats multi-turn chat history, and securely safeguards API keys on the server.
- **Node.js Local Runner (`server.js`)**: Standalone Express server in Node.js allowing 1-command local execution and testing of the Edge Function endpoint.

---

## Folder Structure

```
task-3/
├── backend/
│   ├── supabase/
│   │   └── functions/chat-gemini/index.js    # Supabase Edge function for Gemini
│   ├── server.js                             # Node.js local runner for Edge Function
│   ├── package.json
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

### 3. Run the Backend (Node.js Edge Function Runner)
```bash
cd task-3/backend
npm install
npm start
```
Runs at `http://localhost:54323`.

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
