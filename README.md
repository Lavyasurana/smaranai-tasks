# Full-Stack & GenAI Assessment Projects (3 Tasks)

This repository contains three independent full-stack and Generative AI projects built with:
- **Frontend**: React 18 + Vite using JSX (`.jsx`, no TypeScript)
- **Backend & Edge Functions**: Node.js and JavaScript (`server.js` and Supabase Edge Functions)
- **Database & Auth**: Supabase PostgreSQL (RLS, Database RPC, Google OAuth, Realtime)
- **Generative AI**: Google Gemini API (`gemini-3.6-flash`)
- **Isolation**: Each task resides in its own folder with dedicated `.env`, dependencies, backend, and frontend.

---

## Repository Map

| Task Folder | Purpose | Core Features | Frontend Port | Backend Port |
| :--- | :--- | :--- | :--- | :--- |
| [`task-1/`](./task-1/) | **Supabase Hands-On** | Supabase Auth, Row-Level Security (RLS), Database RPC functions, Node.js Edge function | `http://localhost:3001` | `http://localhost:54321` |
| [`task-2/`](./task-2/) | **Google Login & Tracker** | React Google OAuth, Supabase Edge Function audit logger, Realtime live login history | `http://localhost:3002` | `http://localhost:54322` |
| [`task-3/`](./task-3/) | **FS-GenAI Chatbot** | React Chatbot UI, Supabase Edge Function to Gemini API, Multi-turn context, Markdown formatting | `http://localhost:3003` | `http://localhost:54323` |

---

## Quick Start Summary

### Task 1: Supabase Hands-On (RLS, RPC, Auth, Edge Function)
```bash
# 1. Run Backend
cd task-1/backend && npm start

# 2. In another terminal, run Frontend
cd task-1/frontend && npm run dev
```

### Task 2: Google Login & Real-time Audit Trail
```bash
# 1. Run Backend
cd task-2/backend && npm start

# 2. In another terminal, run Frontend
cd task-2/frontend && npm run dev
```

### Task 3: FS-GenAI Chatbot with Gemini API
```bash
# 1. Run Backend
cd task-3/backend && npm start

# 2. In another terminal, run Frontend
cd task-3/frontend && npm run dev
```

---

## Detailed Task Documentation
For step-by-step Supabase database schema setup (copy-paste SQL scripts), environment variables, and testing guidelines:
- [Task 1 Documentation](./task-1/README.md)
- [Task 2 Documentation](./task-2/README.md)
- [Task 3 Documentation](./task-3/README.md)
