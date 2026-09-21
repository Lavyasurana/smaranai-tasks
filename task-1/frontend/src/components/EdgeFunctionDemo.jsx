import React, { useState } from 'react';
import { Cpu, Send, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';

export default function EdgeFunctionDemo({ session }) {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const [functionUrl, setFunctionUrl] = useState(
    import.meta.env.VITE_EDGE_FUNCTION_URL || (isLocal ? 'http://localhost:54321/functions/v1/admin-action' : '/api/admin-action')
  );
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const invokeEdgeFunction = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'admin_security_audit',
          clientTimestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      setResponse(data);
    } catch (err) {
      setError(`Edge Function invocation failed: ${err.message}. (Ensure the backend is running with 'npm start' in task-1/backend)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <Cpu size={22} color="#f43f5e" />
        <span>4. Supabase Edge Functions (Node.js/JavaScript)</span>
      </div>

      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
        Supabase Edge Functions are server-side JavaScript functions running globally near your users. They are ideal for secure operations requiring the
        <code style={{ color: '#38bdf8' }}> SUPABASE_SERVICE_ROLE_KEY</code>, third-party API webhooks, and backend business logic.
      </p>

      <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
            <Globe size={14} color="#38bdf8" /> Target Edge Function Endpoint:
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', background: '#090d16', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', color: '#38bdf8' }}>
            POST {functionUrl.replace(/http:\/\/localhost:\d+/, '') || '/functions/v1/admin-action'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: session ? '#10b981' : '#f59e0b' }}>
            {session ? '✓ Authorization JWT attached automatically' : '⚠️ Unauthenticated (Invoking as anonymous caller)'}
          </span>
          <button onClick={invokeEdgeFunction} className="btn-primary" disabled={loading}>
            <Send size={15} /> {loading ? 'Invoking Function...' : 'Invoke Edge Function'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-warning">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {response && (
        <div>
          <div className="alert-banner alert-success" style={{ marginBottom: '12px' }}>
            <CheckCircle2 size={18} />
            <div><strong>Function Responded Successfully!</strong></div>
          </div>
          <div className="code-block" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {JSON.stringify(response, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
