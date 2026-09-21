import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from './components/ChatHeader';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { Sparkles, Bot, Plus, MessageSquare } from 'lucide-react';

const STARTER_PROMPTS = [
  'Explain Supabase Row-Level Security (RLS) with practical examples',
  'How do I create and call an RPC function in PostgreSQL using Supabase?',
  'What are the advantages of Supabase Edge Functions over traditional servers?',
  'Write a React component to handle Google OAuth login in Supabase',
];

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '👋 Hello! I am your AI assistant powered by **Google Gemini** through a **Supabase Edge Function** backend.\n\nAsk me anything about full-stack development, Supabase, PostgreSQL RLS, RPC, or generative AI!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gemini-3.6-flash');
  const [systemInstruction, setSystemInstruction] = useState(
    'You are an expert Full-Stack developer and GenAI engineer. Provide clear, accurate, and practical explanations with code examples.'
  );
  const [temperature, setTemperature] = useState(0.7);
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const defaultEdgeUrl = import.meta.env.VITE_EDGE_FUNCTION_URL || (isLocal ? 'http://localhost:54323/functions/v1/chat-gemini' : '/api/chat-gemini');
  const [edgeUrl, setEdgeUrl] = useState(defaultEdgeUrl);
  const [backendHealthy, setBackendHealthy] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Check health of backend runner / serverless function
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthUrl = edgeUrl.includes('/functions/v1/chat-gemini')
          ? edgeUrl.replace('/functions/v1/chat-gemini', '/health')
          : edgeUrl;
        const res = await fetch(healthUrl);
        const data = await res.json();
        setBackendHealthy(data.status === 'ok');
      } catch {
        setBackendHealthy(false);
      }
    };
    checkHealth();
  }, [edgeUrl]);

  const handleSendMessage = async (textToSend = null) => {
    const promptText = textToSend || input;
    if (!promptText.trim() || loading) return;

    const userMessage = { role: 'user', content: promptText };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          model,
          systemInstruction,
          temperature,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to get AI response`);
      }

      const botReply = {
        role: 'assistant',
        content: data.reply || 'No response returned from Gemini.',
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error communicating with Gemini Edge Function:**\n\n${err.message}\n\n*Make sure the backend is running (\`npm start\` in \`task-3/backend\`) and your \`GEMINI_API_KEY\` is set in \`task-3/backend/.env\`.*`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation reset. How can I help you today?',
      },
    ]);
  };

  return (
    <div className="chat-app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="avatar-icon bot" style={{ width: '28px', height: '28px' }}>
            <Bot size={16} />
          </div>
          <h2>FS-GenAI Assistant</h2>
        </div>

        <div className="sidebar-content">
          <button
            onClick={handleClearChat}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500,
              fontSize: '13px',
              width: '100%',
            }}
          >
            <Plus size={16} /> New Conversation
          </button>

          <div style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
              Suggested Inquiries
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  style={{
                    background: '#151d30',
                    border: '1px solid #22304e',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <MessageSquare size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#38bdf8' }} />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: backendHealthy === true ? '#10b981' : backendHealthy === false ? '#f43f5e' : '#f59e0b',
                display: 'inline-block',
              }}
            />
            <span style={{ color: '#cbd5e1' }}>
              {backendHealthy === true
                ? 'Edge Function Runner Online'
                : backendHealthy === false
                ? 'Backend Disconnected'
                : 'Checking Edge Runner...'}
            </span>
          </div>
          <div>{isLocal ? 'Port: 54323 | Node.js Backend' : 'Vercel Serverless Function'}</div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <ChatHeader model={model} />

        <div className="messages-container">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="avatar-icon bot">
                <Sparkles size={18} />
              </div>
              <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontStyle: 'italic' }}>
                <span>Gemini is generating response</span>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          loading={loading}
        />
      </main>
    </div>
  );
}
