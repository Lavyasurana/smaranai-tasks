import React, { useState, useEffect } from 'react';
import { supabase, getSupabaseCredentials } from './supabaseClient';
import AuthCard from './components/AuthCard';
import RlsDemo from './components/RlsDemo';
import RpcDemo from './components/RpcDemo';
import EdgeFunctionDemo from './components/EdgeFunctionDemo';
import { Layers, ShieldCheck, Database, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('auth-rls');
  const { isConfigured } = getSupabaseCredentials();

  useEffect(() => {
    // Listen for auth state changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="header-title">
          <Layers size={28} color="#38bdf8" />
          <div>
            <h1>Task 1: Supabase Hands-On Assessment</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Full-Stack Demo: Auth, Row-Level Security (RLS), Database RPC & Node.js Edge Functions
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={isConfigured ? 'badge badge-green' : 'badge badge-amber'}>
            {isConfigured ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {isConfigured ? 'Connected to Supabase' : 'Setup Required (.env)'}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'auth-rls' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth-rls')}
        >
          <ShieldCheck size={16} /> 1 & 2. Auth & RLS
        </button>
        <button
          className={`nav-tab ${activeTab === 'rpc' ? 'active' : ''}`}
          onClick={() => setActiveTab('rpc')}
        >
          <Database size={16} /> 3. Database RPC
        </button>
        <button
          className={`nav-tab ${activeTab === 'edge' ? 'active' : ''}`}
          onClick={() => setActiveTab('edge')}
        >
          <Cpu size={16} /> 4. Edge Functions
        </button>
      </nav>

      {/* Tab Content */}
      <main>
        {activeTab === 'auth-rls' && (
          <div>
            <AuthCard session={session} setSession={setSession} />
            <RlsDemo session={session} />
          </div>
        )}

        {activeTab === 'rpc' && (
          <div>
            <RpcDemo session={session} />
          </div>
        )}

        {activeTab === 'edge' && (
          <div>
            <EdgeFunctionDemo session={session} />
          </div>
        )}
      </main>
    </div>
  );
}
