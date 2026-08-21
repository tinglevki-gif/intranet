import React from 'react';
import { Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let inList = false;
  let listBuffer = [];

  const flushList = (key) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc list-inside space-y-1.5 my-3 text-slate-700">
          {listBuffer.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
      inList = false;
    }
  };

  const flushCodeBlock = (key) => {
    if (codeBuffer.length > 0) {
      elements.push(
        <pre
          key={`code-${key}`}
          className="my-4 p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner"
        >
          <code>{codeBuffer.join('\n')}</code>
        </pre>
      );
      codeBuffer = [];
      inCodeBlock = false;
    }
  };

  const formatInlineText = (text) => {
    if (!text) return '';
    
    // Bold: **text**
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    // Simple regex parser for **bold**, *italic*, `code`, [link](url)
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add preceding plain text
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[2]) {
        // **bold**
        parts.push(<strong key={keyIdx++} className="font-bold text-slate-900">{match[2]}</strong>);
      } else if (match[3]) {
        // *italic*
        parts.push(<em key={keyIdx++} className="italic text-slate-800">{match[3]}</em>);
      } else if (match[4]) {
        // `code`
        parts.push(
          <code key={keyIdx++} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-600 font-mono text-xs font-semibold">
            {match[4]}
          </code>
        );
      } else if (match[5] && match[6]) {
        // [link](url)
        parts.push(
          <a
            key={keyIdx++}
            href={match[6]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline font-medium"
          >
            {match[5]}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(index);
      } else {
        flushList(index);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // List item (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listBuffer.push(trimmed.substring(2));
      return;
    } else {
      flushList(index);
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={`num-${index}`} className="flex items-start space-x-2 my-2 text-slate-700">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
            {trimmed.match(/^\d+/)[0]}
          </span>
          <p className="leading-relaxed flex-1 pt-0.5">{formatInlineText(text)}</p>
        </div>
      );
      return;
    }

    // GitHub alert boxes
    if (trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> [!TIP]')) {
      elements.push(
        <div key={`alert-${index}`} className="my-4 p-4 rounded-2xl bg-sky-50 border border-sky-200/80 text-sky-900 flex items-start space-x-3">
          <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed">
            {formatInlineText(trimmed.replace(/^>\s*\[!(NOTE|TIP)\]\s*/, ''))}
          </div>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('> [!WARNING]') || trimmed.startsWith('> [!CAUTION]')) {
      elements.push(
        <div key={`alert-${index}`} className="my-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed">
            {formatInlineText(trimmed.replace(/^>\s*\[!(WARNING|CAUTION)\]\s*/, ''))}
          </div>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('> [!IMPORTANT]')) {
      elements.push(
        <div key={`alert-${index}`} className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed">
            {formatInlineText(trimmed.replace(/^>\s*\[!IMPORTANT\]\s*/, ''))}
          </div>
        </div>
      );
      return;
    }

    // Standard Quote block
    if (trimmed.startsWith('>')) {
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="my-3 pl-4 py-1.5 border-l-4 border-indigo-500 bg-indigo-50/40 rounded-r-xl text-slate-700 italic text-sm"
        >
          {formatInlineText(trimmed.replace(/^>\s*/, ''))}
        </blockquote>
      );
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-base sm:text-lg font-bold text-slate-900 mt-6 mb-2">
          {formatInlineText(trimmed.substring(4))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg sm:text-xl font-extrabold text-slate-900 mt-8 mb-3 pb-1 border-b border-slate-100">
          {formatInlineText(trimmed.substring(3))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-4">
          {formatInlineText(trimmed.substring(2))}
        </h1>
      );
      return;
    }

    // Horizontal divider
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={`hr-${index}`} className="my-6 border-t border-slate-200" />);
      return;
    }

    // Empty lines
    if (!trimmed) {
      elements.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    // Paragraph
    elements.push(
      <p key={`p-${index}`} className="text-sm text-slate-700 leading-relaxed my-2">
        {formatInlineText(trimmed)}
      </p>
    );
  });

  flushList(lines.length);
  flushCodeBlock(lines.length);

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
