import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, RefreshCw, Radio, Search, Laptop, UserCheck } from 'lucide-react';

export default function LoginHistoryTable({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  const [errorMsg, setErrorMsg] = useState(null);

  const fetchLoginLogs = async () => {
    setLoading(true);
    let records = null;

    // 1. Try fetching directly from Supabase
    try {
      const { data, error } = await supabase
        .from('login_records')
        .select('*')
        .order('logged_in_at', { ascending: false })
        .limit(50);

      if (!error && Array.isArray(data) && data.length > 0) {
        records = data;
        setErrorMsg(null);
      } else if (error) {
        console.warn('Direct Supabase fetch:', error.message);
      }
    } catch (err) {
      console.warn('Direct Supabase exception:', err.message);
    }

    // 2. If direct Supabase query returned no records or errored, fetch via backend Edge runner
    if (!records || records.length === 0) {
      try {
        const edgeUrl = import.meta.env.VITE_EDGE_FUNCTION_URL || 'http://localhost:54322/functions/v1/log-login';
        const backendLogUrl = edgeUrl.includes('/functions/v1/log-login')
          ? edgeUrl.replace('/functions/v1/log-login', '/api/logins')
          : 'http://localhost:54322/api/logins';

        const res = await fetch(backendLogUrl);
        if (res.ok) {
          const json = await res.json();
          if (json.records && Array.isArray(json.records) && json.records.length > 0) {
            records = json.records;
            setErrorMsg(null);
          }
        }
      } catch (err) {
        console.warn('Backend edge runner fetch failed:', err.message);
      }
    }

    if (records && records.length > 0) {
      setLogs(records);
    } else {
      const localLogs = JSON.parse(localStorage.getItem('TASK2_DEMO_LOGS') || '[]');
      setLogs(localLogs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLoginLogs();

    // Auto-poll every 3 seconds for instant updates across tabs/logins
    const pollInterval = setInterval(() => {
      fetchLoginLogs();
    }, 3000);

    // Set up Supabase Realtime subscription
    let channel;
    try {
      channel = supabase
        .channel('public:login_records')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'login_records' },
          (payload) => {
            setLogs((prev) => {
              const exists = prev.some((p) => p.id === payload.new.id);
              if (exists) return prev;
              return [payload.new, ...prev];
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeActive(true);
          }
        });
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }

    return () => {
      clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Unknown';
    try {
      const date = new Date(isoString);
      return {
        exact: date.toLocaleString(),
        relative: getRelativeTimeString(date),
      };
    } catch {
      return { exact: isoString, relative: '' };
    }
  };

  function getRelativeTimeString(date) {
    const deltaSeconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (deltaSeconds < 30) return 'Just now';
    if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
    const deltaMinutes = Math.round(deltaSeconds / 60);
    if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
    const deltaHours = Math.round(deltaMinutes / 60);
    if (deltaHours < 24) return `${deltaHours}h ago`;
    const deltaDays = Math.round(deltaHours / 24);
    return `${deltaDays}d ago`;
  }

  const parseBrowser = (userAgent) => {
    if (!userAgent) return 'Web Browser';
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('Safari')) return 'Apple Safari';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    return 'Web Client';
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.email?.toLowerCase().includes(term) ||
      log.user_name?.toLowerCase().includes(term) ||
      log.user_agent?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="card-title" style={{ margin: 0 }}>
          <Clock size={22} color="#10b981" />
          <span>Login History & Timestamps ({filteredLogs.length})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`badge ${isRealtimeActive ? 'badge-green' : 'badge-blue'}`}>
            <Radio size={12} className={isRealtimeActive ? 'spin' : ''} />
            {isRealtimeActive ? 'Realtime Live Updates On' : 'Polling Active'}
          </span>
          <button onClick={fetchLoginLogs} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Search by name, email, or device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '34px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748b' }} />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b', fontSize: '14px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          <UserCheck size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <div>No login records found yet.</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Sign in above or click a demo persona to log an event!</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email Address</th>
                <th>Logged In At (Timestamp)</th>
                <th>Device / Browser</th>
                <th>Client IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const timeInfo = formatTimestamp(log.logged_in_at);
                return (
                  <tr key={log.id || Math.random()}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {log.avatar_url ? (
                          <img src={log.avatar_url} alt="Avatar" className="avatar" />
                        ) : (
                          <div className="avatar">
                            {log.user_name?.[0]?.toUpperCase() || log.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                            {log.user_name || log.email?.split('@')[0]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{log.email}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: '#38bdf8' }}>{timeInfo.exact}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>({timeInfo.relative})</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Laptop size={14} color="#a855f7" />
                        <span>{parseBrowser(log.user_agent)}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748b' }}>
                        {log.ip_address || '127.0.0.1'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
