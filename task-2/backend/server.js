import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.TASK2_PORT || 54322;

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
    task: 'task-2',
    runtime: `Node.js ${process.version}`,
    supabaseConfigured: Boolean(supabaseUrl && serviceRoleKey)
  });
});

// Emulated Supabase Edge Function: /functions/v1/log-login
app.post('/functions/v1/log-login', async (req, res) => {
  try {
    const adminClient = getAdminClient();
    const { userId, email, userName, avatarUrl, userAgent: clientUserAgent } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = clientUserAgent || req.headers['user-agent'] || 'Unknown Browser';

    if (!adminClient) {
      // In-memory fallback if credentials not yet configured
      console.warn('[Task-2 Backend] Supabase credentials not set, returning mock logged record');
      return res.status(201).json({
        success: true,
        mock: true,
        record: {
          id: `mock-${Date.now()}`,
          user_id: userId || 'demo-user-id',
          email,
          user_name: userName || email.split('@')[0],
          avatar_url: avatarUrl || null,
          user_agent: userAgent,
          ip_address: clientIp,
          logged_in_at: new Date().toISOString()
        }
      });
    }

    const isValidUuid = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const safeUserId = isValidUuid(userId) ? userId : null;

    const { data, error } = await adminClient
      .from('login_records')
      .insert([
        {
          user_id: safeUserId,
          email,
          user_name: userName || email.split('@')[0],
          avatar_url: avatarUrl || null,
          user_agent: userAgent,
          ip_address: clientIp,
          logged_in_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: 'Login recorded successfully via Node.js Edge Function runner',
      record: data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/logins and /functions/v1/log-login to retrieve login history
app.get(['/api/logins', '/functions/v1/log-login'], async (req, res) => {
  try {
    const adminClient = getAdminClient();
    if (!adminClient) {
      return res.json({ success: true, records: [] });
    }
    const { data, error } = await adminClient
      .from('login_records')
      .select('*')
      .order('logged_in_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.json({ success: true, records: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Edge Function hosting for the React Single Page App
const distPath = path.join(__dirname, '../frontend/dist');
app.get('/functions/v1/serve-app', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  try {
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  } catch (e) {
    // fall through to edge info banner
  }
  res.send(`
    <html>
      <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:40px;">
        <div style="max-width:500px;margin:auto;background:#1e293b;padding:24px;border-radius:12px;">
          <h2>Node.js Edge Function Host (Task 2)</h2>
          <p>Running on Node.js ${process.version}</p>
          <p>Build the frontend with <code>npm run build</code> in <code>task-2/frontend</code> to host directly here.</p>
          <a href="http://localhost:3002" style="color:#38bdf8;">Open React Dev Server (Port 3002) &rarr;</a>
        </div>
      </body>
    </html>
  `);
});

// Serve assets if built
app.use(express.static(distPath));

app.listen(PORT, () => {
  console.log(`[Task-2 Backend] Node.js Edge Function runner listening at http://localhost:${PORT}`);
});
