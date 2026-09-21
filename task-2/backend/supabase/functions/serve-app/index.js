// Supabase Edge Function: serve-app
// Demonstrates hosting and serving the application or web response from an Edge Function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default async function handler(req) {
  const url = new URL(req.url);

  // Return an edge-rendered HTML landing page or status
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Supabase Edge Function Hosted Application</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; display: flex; justify-content: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin-top: 0; font-size: 24px; }
    p { color: #94a3b8; line-height: 1.6; }
    .badge { background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; border: 1px solid rgba(16, 185, 129, 0.3); }
    a.btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Edge Function Hosted</span>
    <h1>Task 2: Supabase Edge Function Host</h1>
    <p>This page is hosted and dynamically rendered directly by a Supabase Edge Function running globally on edge servers.</p>
    <p><strong>Path accessed:</strong> <code>${url.pathname}</code></p>
    <p><strong>Timestamp:</strong> <code>${new Date().toISOString()}</code></p>
    <a href="http://localhost:3002" class="btn">Open React Single Page Application &rarr;</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(handler);
}
