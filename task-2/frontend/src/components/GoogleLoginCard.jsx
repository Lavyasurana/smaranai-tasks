import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogIn, LogOut, CheckCircle, Sparkles } from 'lucide-react';

export default function GoogleLoginCard({ session, setSession, onLoginRecorded }) {
  const [loading, setLoading] = useState(false);
  const [demoEmail, setDemoEmail] = useState('');
  const [demoName, setDemoName] = useState('');
  const [error, setError] = useState(null);

  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const edgeFunctionUrl = import.meta.env.VITE_EDGE_FUNCTION_URL || (isLocal ? 'http://localhost:54322/functions/v1/log-login' : '/api/log-login');

  // 1. Google OAuth Sign In
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      setError(`Google OAuth initialization failed: ${err.message}. (Ensure Google provider is enabled in Supabase Dashboard → Authentication → Providers).`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Demo / Instant Test Login
  const handleDemoLogin = async (personaName, personaEmail, avatarUrl) => {
    setLoading(true);
    setError(null);
    try {
      const demoUuids = {
        'Lavya Surana': '11111111-1111-1111-1111-111111111111',
        'Sarah Chen': '22222222-2222-2222-2222-222222222222',
        'Alex Rodriguez': '33333333-3333-3333-3333-333333333333',
      };
      const validUserId = demoUuids[personaName] || null;

      const payload = {
        userId: validUserId,
        email: personaEmail,
        userName: personaName,
        avatarUrl,
        userAgent: navigator.userAgent,
      };

      let recorded = false;
      try {
        const res = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) recorded = true;
      } catch (e) {
        console.warn('Edge Function runner offline, using direct Supabase insert:', e);
      }

      if (!recorded) {
        await supabase.from('login_records').insert([
          {
            user_id: payload.userId,
            email: payload.email,
            user_name: payload.userName,
            avatar_url: payload.avatarUrl,
            user_agent: payload.userAgent,
            logged_in_at: new Date().toISOString(),
          }
        ]);
      }

      setSession({
        user: {
          id: validUserId || '00000000-0000-0000-0000-000000000000',
          email: payload.email,
          user_metadata: {
            full_name: payload.userName,
            avatar_url: payload.avatarUrl,
          },
        },
      });

      if (onLoginRecorded) onLoginRecorded();
    } catch (err) {
      setError(`Demo login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="card">
      <div className="card-title">
        <LogIn size={22} color="#38bdf8" />
        <span>Authentication & Login Tracker</span>
      </div>

      {session ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#090d16', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
            {session.user.user_metadata?.avatar_url ? (
              <img
                src={session.user.user_metadata.avatar_url}
                alt="Avatar"
                className="avatar"
                style={{ width: '48px', height: '48px' }}
              />
            ) : (
              <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                {session.user.email?.[0]?.toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600 }}>
                  {session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}
                </h4>
                <span className="badge badge-green">
                  <CheckCircle size={12} /> Logged In
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>{session.user.email}</p>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                User ID: <code>{session.user.id}</code>
              </div>
            </div>

            <div>
              <button onClick={handleSignOut} className="btn-danger" style={{ fontSize: '13px', padding: '8px 16px' }}>
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px' }}>
            Sign in using Google OAuth or instant demo accounts. Every login event is securely captured by the <strong>Supabase Edge Function</strong> and saved into the Supabase database with exact timestamps.
          </p>

          {/* Google Login Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '14px', marginBottom: '24px' }}>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-google"
            >
              {/* Google official SVG logo */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Sign in with Google
            </button>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Requires Google Client ID & Secret configured in your Supabase Auth Providers.
            </span>
          </div>

          {/* Instant Test Logins */}
          <div style={{ background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#f59e0b" />
              <strong style={{ fontSize: '13px', color: '#f8fafc' }}>Quick Demo Personas (Instant Test):</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
              Click any profile below to trigger the Edge Function and log a real event immediately:
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('Lavya Surana', 'lavya.surana@gmail.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Lavya')}
                className="btn-secondary"
                style={{ fontSize: '12px' }}
                disabled={loading}
              >
                👤 Lavya Surana
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Sarah Chen', 'sarah.chen@techcorp.io', 'https://api.dicebear.com/7.x/bottts/svg?seed=Sarah')}
                className="btn-secondary"
                style={{ fontSize: '12px' }}
                disabled={loading}
              >
                👩‍💻 Sarah Chen
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Alex Rodriguez', 'alex.rodriguez@example.com', 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex')}
                className="btn-secondary"
                style={{ fontSize: '12px' }}
                disabled={loading}
              >
                👨‍🔬 Alex Rodriguez
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#fde68a', fontSize: '13px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
