// Native Node.js HTTP Runner for Supabase Edge Function (admin-action)
// Note: Built using native node:http standard library - ZERO Express dependencies.
// Executes the canonical Supabase Edge Function (supabase/functions/admin-action/index.js).

import http from 'node:http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './supabase/functions/admin-action/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.TASK1_PORT || process.env.PORT || 54321;

const server = http.createServer(async (nodeReq, nodeRes) => {
  // CORS Preflight
  nodeRes.setHeader('Access-Control-Allow-Origin', '*');
  nodeRes.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  nodeRes.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (nodeReq.method === 'OPTIONS') {
    nodeRes.writeHead(200);
    nodeRes.end('ok');
    return;
  }

  // Health check endpoint
  if (nodeReq.method === 'GET' && (nodeReq.url === '/health' || nodeReq.url === '/')) {
    nodeRes.writeHead(200, { 'Content-Type': 'application/json' });
    nodeRes.end(JSON.stringify({
      status: 'ok',
      task: 'task-1',
      backend: 'Supabase Edge Function',
      runtime: `Node.js ${process.version} (Native HTTP - No Express)`,
      function: 'admin-action',
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    }));
    return;
  }

  // Supabase Edge Function endpoint: /functions/v1/admin-action
  if (nodeReq.method === 'POST' && (nodeReq.url === '/functions/v1/admin-action' || nodeReq.url === '/admin-action')) {
    try {
      const chunks = [];
      for await (const chunk of nodeReq) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();

      const headers = new Headers();
      for (const [key, value] of Object.entries(nodeReq.headers)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }

      const webReq = new Request(`http://localhost:${PORT}${nodeReq.url}`, {
        method: 'POST',
        headers,
        body: rawBody || undefined
      });

      const webRes = await handler(webReq);

      const responseHeaders = {};
      webRes.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });
      responseHeaders['Access-Control-Allow-Origin'] = '*';

      nodeRes.writeHead(webRes.status, responseHeaders);
      const resText = await webRes.text();
      nodeRes.end(resText);
    } catch (err) {
      nodeRes.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      nodeRes.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  nodeRes.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  nodeRes.end(JSON.stringify({ error: 'Endpoint not found. Use POST /functions/v1/admin-action' }));
});

server.listen(PORT, () => {
  console.log(`[Supabase Edge Function] admin-action listening at http://localhost:${PORT}/functions/v1/admin-action`);
  console.log(`[Architecture] Native runtime active (Zero Express dependencies)`);
});
