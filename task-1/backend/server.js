// Node.js Backend Server for Task 1
// Emulates Supabase Edge Functions locally & provides API endpoints
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.TASK1_PORT || 54321;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const getAdminClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey);
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    task: 'task-1',
    runtime: `Node.js ${process.version}`,
    supabaseConfigured: Boolean(supabaseUrl && serviceRoleKey)
  });
});

// Emulated Edge Function Endpoint: /functions/v1/admin-action
app.post('/functions/v1/admin-action', async (req, res) => {
  try {
    const adminClient = getAdminClient();
    if (!adminClient) {
      return res.status(500).json({
        error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in backend/.env'
      });
    }

    const authHeader = req.headers['authorization'];
    let callerInfo = { authenticated: false };

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
      if (!userError && user) {
        callerInfo = {
          authenticated: true,
          userId: user.id,
          email: user.email,
        };
      }
    }

    // Privileged query bypassing RLS to audit system count
    const { count: totalNotesCount, error: notesErr } = await adminClient
      .from('notes')
      .select('*', { count: 'exact', head: true });

    return res.json({
      success: true,
      message: 'Node.js Supabase Edge Function runner executed successfully!',
      timestamp: new Date().toISOString(),
      caller: callerInfo,
      serverDiagnostics: {
        runtime: `Node.js ${process.version}`,
        totalNotesInSystem: totalNotesCount || 0,
        notesError: notesErr ? notesErr.message : null,
        actionRequested: req.body?.action || 'audit_ping',
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Task-1 Backend] Local Edge Function runner listening at http://localhost:${PORT}`);
});
