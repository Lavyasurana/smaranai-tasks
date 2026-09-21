import React, { useState, useEffect } from 'react';
import Task1App from '@task1/App.jsx';
import Task2App from '@task2/App.jsx';
import Task3App from '@task3/App.jsx';
import { Shield, Users, Sparkles, Code2 } from 'lucide-react';

export default function App() {
  const [activeTask, setActiveTask] = useState(() => {
    // Check URL hash if recruiter navigates to #task2 or #task3
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['task1', 'task2', 'task3'].includes(hash)) return hash;
    }
    return 'task1';
  });

  useEffect(() => {
    window.location.hash = activeTask;
  }, [activeTask]);

  return (
    <div className="unified-portal">
      {/* Top Recruiter Navigation Bar */}
      <header className="portal-navbar">
        <div className="portal-brand">
          <div className="portal-logo">
            <Code2 size={20} color="#38bdf8" />
          </div>
          <div>
            <div className="portal-title">Full-Stack Assessment Suite</div>
            <div className="portal-subtitle">Supabase, Edge Functions & GenAI</div>
          </div>
        </div>

        <nav className="portal-tabs">
          <button
            className={`portal-tab ${activeTask === 'task1' ? 'active' : ''}`}
            onClick={() => setActiveTask('task1')}
          >
            <Shield size={16} />
            <span>Task 1: Supabase RLS & RPC</span>
          </button>

          <button
            className={`portal-tab ${activeTask === 'task2' ? 'active' : ''}`}
            onClick={() => setActiveTask('task2')}
          >
            <Users size={16} />
            <span>Task 2: Google Login & Audit</span>
          </button>

          <button
            className={`portal-tab ${activeTask === 'task3' ? 'active' : ''}`}
            onClick={() => setActiveTask('task3')}
          >
            <Sparkles size={16} />
            <span>Task 3: Gemini GenAI Chatbot</span>
          </button>
        </nav>

        <div className="portal-status">
          <span className="portal-badge">
            <span className="portal-dot" />
            Live Suite
          </span>
        </div>
      </header>

      {/* Task Content Viewport */}
      <main className={`portal-viewport ${activeTask === 'task3' ? 'viewport-chat' : 'viewport-scroll'}`}>
        {activeTask === 'task1' && <Task1App />}
        {activeTask === 'task2' && <Task2App />}
        {activeTask === 'task3' && <Task3App />}
      </main>
    </div>
  );
}
