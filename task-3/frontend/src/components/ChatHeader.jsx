import { Sparkles } from 'lucide-react';

export default function ChatHeader({ model }) {
  return (
    <div className="chat-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="avatar-icon bot" style={{ width: '32px', height: '32px' }}>
          <Sparkles size={16} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Gemini AI Assistant</span>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)'
            }}>
              {model}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
