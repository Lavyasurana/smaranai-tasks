import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Unlock, Plus, RefreshCw, Trash2, Shield } from 'lucide-react';

export default function RlsDemo({ session }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'private') {
        query = query.eq('is_private', true);
      } else if (filter === 'public') {
        query = query.eq('is_private', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Failed to fetch notes: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [session, filter]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!session) {
      alert('Please sign in first to create notes with RLS (auth.uid() required).');
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            is_private: isPrivate,
            user_id: session.user.id,
          },
        ])
        .select();

      if (error) throw error;
      setTitle('');
      setContent('');
      setStatusMessage({ type: 'success', text: 'Note created with RLS protection!' });
      fetchNotes();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setStatusMessage({ type: 'success', text: 'Note deleted (RLS authorized)' });
      fetchNotes();
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Delete rejected by RLS: ${err.message}` });
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="card-title" style={{ margin: 0 }}>
          <Shield size={22} color="#10b981" />
          <span>2. Row-Level Security (RLS) Hands-on</span>
        </div>
        <button onClick={fetchNotes} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Notes
        </button>
      </div>

      {/* RLS Explanation Banner */}
      <div className="alert-banner alert-info" style={{ fontSize: '13px' }}>
        <Shield size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>How RLS is enforced here:</strong>
          <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
            <li><code>SELECT</code> policy allows reading if: <code>auth.uid() = user_id OR is_private = false</code>.</li>
            <li>If you sign in as <strong>Alice</strong> and create a private note, <strong>Bob</strong> will never see it, even with direct API requests!</li>
            <li>Public notes (<code>is_private = false</code>) are visible to all users.</li>
          </ul>
        </div>
      </div>

      {/* Create Note Form */}
      <div style={{ background: '#0b1120', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} color="#38bdf8" /> Create New Record
        </h4>
        <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ flex: '1 1 200px' }}
              required
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', background: '#1e293b', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              {isPrivate ? (
                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={14} /> Private (RLS Restricted)
                </span>
              ) : (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Unlock size={14} /> Public (Visible to all)
                </span>
              )}
            </label>
          </div>

          <textarea
            placeholder="Note content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            style={{ width: '100%', resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {session ? `Author: ${session.user.email}` : '⚠️ Unauthenticated (Sign in above to insert)'}
            </span>
            <button type="submit" className="btn-primary" disabled={loading || !session}>
              <Plus size={16} /> Insert Note
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>View Filter:</span>
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'badge badge-blue' : 'btn-secondary'}
          style={{ padding: '4px 12px', fontSize: '12px' }}
        >
          All Visible ({notes.length})
        </button>
        <button
          onClick={() => setFilter('private')}
          className={filter === 'private' ? 'badge badge-amber' : 'btn-secondary'}
          style={{ padding: '4px 12px', fontSize: '12px' }}
        >
          My Private Notes
        </button>
        <button
          onClick={() => setFilter('public')}
          className={filter === 'public' ? 'badge badge-green' : 'btn-secondary'}
          style={{ padding: '4px 12px', fontSize: '12px' }}
        >
          Public Notes
        </button>
      </div>

      {statusMessage && (
        <div className={`alert-banner ${statusMessage.type === 'error' ? 'alert-warning' : 'alert-success'}`} style={{ marginBottom: '14px' }}>
          {statusMessage.text}
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontSize: '14px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
          No notes found for this view. Create one above to test RLS!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {notes.map((note) => {
            const isOwner = session?.user?.id === note.user_id;
            return (
              <div
                key={note.id}
                style={{
                  background: '#0e1626',
                  border: `1px solid ${note.is_private ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h5 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>{note.title}</h5>
                    <span className={note.is_private ? 'badge badge-amber' : 'badge badge-green'}>
                      {note.is_private ? <><Lock size={11} /> Private</> : <><Unlock size={11} /> Public</>}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                    {note.content || <em>(No content)</em>}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                  <span>{isOwner ? '👤 By You' : `👤 User: ${note.user_id.slice(0, 8)}...`}</span>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ background: 'transparent', color: '#f43f5e', padding: '4px', cursor: 'pointer' }}
                      title="Delete (allowed by RLS)"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
