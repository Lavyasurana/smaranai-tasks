import React, { useState, useEffect } from 'react';
import { supabase, getSupabaseCredentials } from './supabaseClient';
import GoogleLoginCard from './components/GoogleLoginCard';
import LoginHistoryTable from './components/LoginHistoryTable';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isConfigured } = getSupabaseCredentials();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        recordSessionLogin(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        await recordSessionLogin(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const recordSessionLogin = async (session) => {
    if (!session || !session.user) return;
    try {
      const payload = {
        userId: session.user.id,
        email: session.user.email,
        userName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        avatarUrl: session.user.user_metadata?.avatar_url,
        userAgent: navigator.userAgent,
      };

      // 1. Record via Edge Function runner
      try {
        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const edgeUrl = import.meta.env.VITE_EDGE_FUNCTION_URL || (isLocal ? 'http://localhost:54322/functions/v1/log-login' : '/api/log-login');
        await fetch(edgeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn('Edge runner record error:', e);
      }

      // 2. Direct Supabase insert fallback for guaranteed recording
      try {
        await supabase.from('login_records').insert([
          {
            user_id: payload.userId,
            email: payload.email,
            user_name: payload.userName,
            avatar_url: payload.avatarUrl,
            user_agent: payload.userAgent,
            logged_in_at: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        console.warn('Direct Supabase insert error:', e);
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (e) {
      console.warn('Auto record session error:', e);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="header-title">
          <div>
            <h1>Task 2: Google Login & Real-time Login Audit</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Google OAuth, Supabase Edge Function Logger & Real-time Login Records Dashboard
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={isConfigured ? 'badge badge-green' : 'badge badge-blue'}>
            {isConfigured ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {isConfigured ? 'Supabase Connected' : 'Config / Local Mode'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <GoogleLoginCard
          session={session}
          setSession={setSession}
          onLoginRecorded={() => setRefreshTrigger((p) => p + 1)}
        />
        <LoginHistoryTable refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
}
