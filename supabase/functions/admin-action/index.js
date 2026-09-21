// Supabase Edge Function: admin-action
// Demonstrates running elevated backend actions with the Service Role Key

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async function handler(req) {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || process.env.SUPABASE_URL;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client bypasses RLS for administrative auditing
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Read optional payload
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is okay
    }

    const authHeader = req.headers.get("Authorization");
    let callerInfo = { authenticated: false };

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
      if (!userError && user) {
        callerInfo = {
          authenticated: true,
          userId: user.id,
          email: user.email,
        };
      }
    }

    // Run administrative query: bypasses RLS to count all notes and active users
    const { count: totalNotesCount, error: notesErr } = await adminClient
      .from("notes")
      .select("*", { count: "exact", head: true });

    const startTime = Date.now();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Edge Function executed successfully via Node.js/Edge runtime!",
        timestamp: new Date().toISOString(),
        caller: callerInfo,
        serverDiagnostics: {
          runtime: typeof Deno !== "undefined" ? "Deno Edge Runtime" : `Node.js ${process.version}`,
          totalNotesInSystem: totalNotesCount || 0,
          notesError: notesErr ? notesErr.message : null,
          actionRequested: body.action || "audit_ping",
          latencyMs: Date.now() - startTime,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// In standard Deno Edge Function environment:
if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(handler);
}
