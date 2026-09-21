# Task 1: Supabase Hands-on (RLS, Edge Functions, RPC, Auth)

A full-stack implementation demonstrating the core architectural pillars of Supabase:
- **Authentication (`auth.users`)**: Email/Password login, signup, session tokens.
- **Row-Level Security (RLS)**: Fine-grained PostgreSQL row access policies isolating user data.
- **Database RPC (Stored Functions)**: Server-side PL/pgSQL procedures executed via `supabase.rpc()`.
- **Edge Functions (Node.js/JavaScript)**: Privileged serverless backend operations executing with `SUPABASE_SERVICE_ROLE_KEY`.

---

## Folder Structure

```
task-1/
├── backend/
│   ├── supabase/
│   │   ├── functions/admin-action/index.js   # Supabase Edge function
│   │   └── migrations/schema.sql             # SQL DDL: tables, RLS policies, RPC functions
│   ├── server.js                             # Node.js local runner for Edge function
│   ├── package.json
│   ├── .env.example
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/                       # Auth, RLS demo, RPC invoker, Edge function tester
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

## Getting Started

### 1. Database Setup (Supabase SQL Editor)
1. Open your [Supabase Dashboard](https://app.supabase.com).
2. Go to **SQL Editor** → **New Query**.
3. Copy the contents of [`backend/supabase/migrations/schema.sql`](./backend/supabase/migrations/schema.sql) and click **Run**.

This sets up:
- Table `notes` with `user_id UUID REFERENCES auth.users(id)`.
- RLS enabled with 4 strict policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- RPC functions: `get_user_note_stats(target_user_id UUID)` and `get_community_summary()`.

### 2. Configure Environment Variables
- **Frontend** (`frontend/.env`):
  ```env
  VITE_SUPABASE_URL=https://your-project-ref.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  VITE_EDGE_FUNCTION_URL=http://localhost:54321/functions/v1/admin-action
  ```
- **Backend** (`backend/.env`):
  ```env
  SUPABASE_URL=https://your-project-ref.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  PORT=54321
  ```

*(Note: You can also configure credentials directly inside the frontend web UI using the "Configure" modal!)*

### 3. Running Backend & Local Edge Function Runner
```bash
cd task-1/backend
npm install
npm start
```
The server will run on `http://localhost:54321`.

### 4. Running the Frontend
```bash
cd task-1/frontend
npm install
npm run dev
```
The React frontend will be available at `http://localhost:3001`.

---

## How to Test Each Feature
1. **Auth & RLS Test**:
   - Sign up as **Alice** (`alice@test.com`).
   - Create a **Private Note** ("Alice's secret plans").
   - Create a **Public Note** ("Hello community").
   - Sign out and sign in as **Bob** (`bob@test.com`).
   - Notice: Bob can see Alice's public note, but Alice's private note is completely invisible. Bob cannot edit or delete Alice's note because RLS policy enforces `auth.uid() = user_id`.
2. **RPC Test**:
   - Navigate to the **Database RPC** tab.
   - Click **Run RPC** for `get_user_note_stats` to see the live PostgreSQL aggregation executed on the database server.
   - Click **Run RPC** for `get_community_summary` to see total public notes across all users.
3. **Edge Function Test**:
   - Navigate to the **Edge Functions** tab.
   - Click **Invoke Edge Function**. The frontend passes the user's JWT to the Node.js backend/Edge function, which validates the session and uses the service role key to perform an administrative system audit.
