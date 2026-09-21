import React, { useState } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';

export default function ChatMessage({ message }) {
  const isBot = message.role === 'assistant' || message.role === 'model';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple and clean markdown formatter for code blocks, inline code, bold, bullets
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
        const language = hasLang ? firstLine : '';
        const codeContent = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <div key={index} style={{ position: 'relative', margin: '10px 0' }}>
            {language && (
              <div style={{
                background: '#151f33',
                color: '#94a3b8',
                padding: '4px 12px',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                border: '1px solid var(--border)',
                borderBottom: 'none'
              }}>
                {language}
              </div>
            )}
            <pre className="code-block" style={{
              marginTop: language ? 0 : '10px',
              borderTopLeftRadius: language ? 0 : '8px',
              borderTopRightRadius: language ? 0 : '8px'
            }}>
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Format inline bold and code
      const paragraphs = part.split('\n\n');
      return (
        <React.Fragment key={index}>
          {paragraphs.map((para, pIdx) => {
            const lines = para.split('\n');
            return (
              <p key={pIdx} style={{ margin: pIdx > 0 ? '8px 0 0 0' : 0 }}>
                {lines.map((line, lIdx) => {
                  // Render bullet items
                  const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
                  const cleanLine = isBullet ? line.trim().substring(2) : line;

                  return (
                    <span key={lIdx} style={{ display: isBullet ? 'block' : 'inline', paddingLeft: isBullet ? '16px' : 0 }}>
                      {isBullet && '• '}
                      {parseInlineStyles(cleanLine)}
                      {lIdx < lines.length - 1 && !isBullet && <br />}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </React.Fragment>
      );
    });
  };

  const parseInlineStyles = (line) => {
    // Split by inline code `...` and bold **...**
    const segments = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return segments.map((seg, sIdx) => {
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return <code key={sIdx}>{seg.slice(1, -1)}</code>;
      }
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={sIdx} style={{ color: '#ffffff' }}>{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });
  };

  return (
    <div className={`message-row ${isBot ? 'assistant' : 'user'}`}>
      {isBot && (
        <div className="avatar-icon bot">
          <Bot size={18} />
        </div>
      )}

      <div className="message-bubble" style={{ position: 'relative' }}>
        {renderFormattedText(message.content)}

        {isBot && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: 'none',
                padding: '2px 6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Copy answer"
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {!isBot && (
        <div className="avatar-icon user">
          <User size={18} />
        </div>
      )}
    </div>
  );
}
