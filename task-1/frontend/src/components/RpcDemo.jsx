import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Database, Play, AlertTriangle } from 'lucide-react';

export default function RpcDemo({ session }) {
  const [userStats, setUserStats] = useState(null);
  const [communitySummary, setCommunitySummary] = useState(null);
  const [loadingUserStats, setLoadingUserStats] = useState(false);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [error, setError] = useState(null);

  const callUserStatsRpc = async () => {
    if (!session) {
      alert('Please sign in first to query your personal note stats via RPC!');
      return;
    }
    setLoadingUserStats(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_user_note_stats', {
        target_user_id: session.user.id,
      });
      if (rpcErr) throw rpcErr;
      setUserStats(data);
    } catch (err) {
      setError(`RPC call 'get_user_note_stats' failed: ${err.message}`);
    } finally {
      setLoadingUserStats(false);
    }
  };

  const callCommunityRpc = async () => {
    setLoadingCommunity(true);
    setError(null);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_community_summary');
      if (rpcErr) throw rpcErr;
      setCommunitySummary(data);
    } catch (err) {
      setError(`RPC call 'get_community_summary' failed: ${err.message}`);
    } finally {
      setLoadingCommunity(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <Database size={22} color="#a855f7" />
        <span>3. Database RPC (Remote Procedure Calls)</span>
      </div>

      <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
        Supabase allows executing server-side PostgreSQL functions directly via <code style={{ color: '#38bdf8' }}>supabase.rpc('function_name', params)</code>.
        This provides high performance, atomic operations, and custom business logic within the database engine.
      </p>

      {error && (
        <div className="alert-banner alert-warning">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      <div className="grid-2">
        {/* RPC 1: User Stats */}
        <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
              RPC: <code>get_user_note_stats</code>
            </h4>
            <button
              onClick={callUserStatsRpc}
              className="btn-primary"
              disabled={loadingUserStats}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Play size={14} /> {loadingUserStats ? 'Executing...' : 'Run RPC'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Executes PL/pgSQL function taking <code>target_user_id</code> and calculating total, private, and public notes atomically.
          </p>
          <div className="code-block" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {userStats ? JSON.stringify(userStats, null, 2) : '// Click "Run RPC" to execute'}
          </div>
        </div>

        {/* RPC 2: Global Summary */}
        <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
              RPC: <code>get_community_summary</code>
            </h4>
            <button
              onClick={callCommunityRpc}
              className="btn-primary"
              disabled={loadingCommunity}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <Play size={14} /> {loadingCommunity ? 'Executing...' : 'Run RPC'}
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Aggregates global public notes and active distinct authors across the entire database.
          </p>
          <div className="code-block" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {communitySummary ? JSON.stringify(communitySummary, null, 2) : '// Click "Run RPC" to execute'}
          </div>
        </div>
      </div>
    </div>
  );
}
