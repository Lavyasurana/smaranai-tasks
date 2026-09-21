import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User, LogIn, UserPlus, LogOut, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function AuthCard({ session, setSession }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({
          type: 'success',
          text: data.session
            ? 'Account created and signed in successfully!'
            : 'Sign up successful! Please check your email for confirmation if required, or sign in now.'
        });
        if (data.session) setSession(data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSession(data.session);
        setMessage({ type: 'success', text: `Signed in as ${data.user.email}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMessage({ type: 'success', text: 'Signed out successfully' });
  };

  const setDemoUser = (name) => {
    setEmail(`${name.toLowerCase()}@test.com`);
    setPassword('TestPassword123!');
  };

  return (
    <div className="card">
      <div className="card-title">
        <ShieldCheck size={22} color="#38bdf8" />
        <span>1. Supabase Authentication</span>
      </div>

      {session ? (
        <div>
          <div className="alert-banner alert-success" style={{ marginBottom: '16px' }}>
            <User size={18} />
            <div>
              <strong>Authenticated Session Active</strong>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                Signed in as: <code style={{ color: '#fff' }}>{session.user.email}</code>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>User ID (auth.uid()):</strong> <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{session.user.id}</span></div>
            <div><strong>Access Token:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{session.access_token.slice(0, 24)}... (JWT)</span></div>
          </div>

          <button onClick={handleLogout} className="btn-danger">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
            Sign in or create an account. RLS policies use your authenticated <code style={{ color: '#38bdf8' }}>auth.uid()</code> to isolate your data.
          </p>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
                required
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px' }}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="btn-secondary"
                style={{ fontSize: '13px' }}
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '12px', color: '#64748b', marginRight: '8px' }}>Prefill test persona:</span>
            <button
              type="button"
              onClick={() => setDemoUser('Alice')}
              style={{ background: '#334155', color: '#cbd5e1', padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}
            >
              Alice (User 1)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('Bob')}
              style={{ background: '#334155', color: '#cbd5e1', padding: '4px 10px', fontSize: '12px' }}
            >
              Bob (User 2)
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`alert-banner ${message.type === 'error' ? 'alert-warning' : 'alert-success'}`}
          style={{ marginTop: '16px', marginBottom: 0 }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
