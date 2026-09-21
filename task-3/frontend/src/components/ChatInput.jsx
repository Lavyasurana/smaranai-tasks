import React, { useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

export default function ChatInput({ input, setInput, onSend, loading }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="input-section">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask Gemini anything about Supabase, RLS, Node.js or GenAI... (Press Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="chat-textarea"
          disabled={loading}
        />

        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className="btn-send"
          title="Send message"
        >
          {loading ? (
            <div style={{ display: 'flex' }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          Connected to Supabase Edge Function with Google Gemini API &bull; Press Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}
