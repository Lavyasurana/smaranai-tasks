import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (req.method === 'GET') {
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(200).json({ success: true, records: [] });
    }
    try {
      const client = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await client
        .from('login_records')
        .select('*')
        .order('logged_in_at', { ascending: false })
        .limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, records: data || [] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, email, userName, avatarUrl, userAgent } = req.body || {};
      if (!email) return res.status(400).json({ error: 'email is required' });

      const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
      const userAgentStr = userAgent || req.headers['user-agent'] || 'Unknown Browser';

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(201).json({
          success: true,
          mock: true,
          record: {
            id: `mock-${Date.now()}`,
            user_id: userId || null,
            email,
            user_name: userName || email.split('@')[0],
            avatar_url: avatarUrl || null,
            user_agent: userAgentStr,
            ip_address: clientIp,
            logged_in_at: new Date().toISOString()
          }
        });
      }

      const isValidUuid = (val) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

      const client = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await client
        .from('login_records')
        .insert([
          {
            user_id: isValidUuid(userId) ? userId : null,
            email,
            user_name: userName || email.split('@')[0],
            avatar_url: avatarUrl || null,
            user_agent: userAgentStr,
            ip_address: clientIp,
            logged_in_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Login recorded successfully via Vercel Serverless Function',
        record: data
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
