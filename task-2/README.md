# Task 2: Google Login & Real-time Login History Tracking

A full-stack implementation featuring:
- **React Frontend (JSX + Vite)**: Google OAuth sign-in and live real-time audit dashboard.
- **Supabase Edge Function (`log-login`)**: Captures and validates login events, extracts IP addresses and browser info, and writes records with timestamps to the database.
- **Supabase Edge Function (`serve-app`)**: Dynamic edge-rendered host for the web app.
- **Node.js Local Runner (`server.js`)**: Runs edge function endpoints locally on Node.js without requiring Docker.
- **Database (`login_records`)**: Supabase PostgreSQL table with Realtime streaming enabled.

---

## Folder Structure

```
task-2/
├── backend/
│   ├── supabase/
│   │   ├── functions/log-login/index.js      # Supabase Edge function for login recording
│   │   ├── functions/serve-app/index.js      # Edge function serving application HTML
│   │   └── migrations/schema.sql             # SQL table DDL & Realtime configuration
│   ├── server.js                             # Node.js local runner for Edge Functions
│   ├── package.json
│   ├── .env.example
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/                       # GoogleLoginCard, LoginHistoryTable
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── supabaseClient.js
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example
    └── .env
```

---

## Quick Start

### 1. Supabase Database Setup
1. In your [Supabase Dashboard](https://app.supabase.com), go to **SQL Editor**.
2. Run the script in [`backend/supabase/migrations/schema.sql`](./backend/supabase/migrations/schema.sql).
3. Under **Authentication** → **Providers** → **Google**:
   - Enable Google provider.
   - Add your Google Client ID and Secret (from Google Cloud Console).
   - Add Redirect URL: `https://<your-project-ref>.supabase.co/auth/v1/callback`.

*(Tip: If you haven't set up Google Cloud yet, the app includes **Instant Demo Personas** to test the entire recording and real-time streaming workflow immediately!)*

### 2. Environment Variables
- **Frontend** (`frontend/.env`):
  ```env
  VITE_SUPABASE_URL=https://your-project-ref.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  VITE_EDGE_FUNCTION_URL=http://localhost:54322/functions/v1/log-login
  ```
- **Backend** (`backend/.env`):
  ```env
  SUPABASE_URL=https://your-project-ref.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  PORT=54322
  ```

### 3. Run Backend (Node.js Edge Function Runner)
```bash
cd task-2/backend
npm install
npm start
```
Runs at `http://localhost:54322`.

### 4. Run Frontend (React + Vite)
```bash
cd task-2/frontend
npm install
npm run dev
```
Runs at `http://localhost:3002`.

---

## Live Features
- **Real-Time Login Table**: Whenever a login event occurs, the table updates in real time using Supabase Realtime WebSocket subscriptions without refreshing the page.
- **Detailed Audit Details**: Records User Name, Avatar, Email, Exact Timestamp, Relative Time, User Agent, Browser Type, and Client IP.
- **Search & Filter**: Search live logs instantly by email, name, or browser.
