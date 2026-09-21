import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'ok', endpoint: '/api/admin-action' });

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(200).json({
        success: true,
        message: 'Admin operation simulated (SUPABASE_SERVICE_ROLE_KEY optional on Vercel preview)',
        caller: 'Anonymous / Client',
        serverTimestamp: new Date().toISOString(),
        environment: 'Vercel Serverless Function'
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.authorization;
    let callingUser = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await adminClient.auth.getUser(token);
      callingUser = user ? { id: user.id, email: user.email } : null;
    }

    const { count: totalNotes } = await adminClient.from('notes').select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      message: 'Admin operation executed securely using Supabase Service Role Key',
      executor: 'Service Role Client',
      caller: callingUser || 'Anonymous Caller',
      metrics: {
        totalSystemNotes: totalNotes ?? 0,
        serverTimestamp: new Date().toISOString(),
        environment: 'Vercel Serverless Function'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
