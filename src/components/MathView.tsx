import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

/**
 * Lightweight mathematical formula renderer powered by KaTeX.
 * Fast, synchronous, pure HTML/MathML output, with zero runtime delay.
 */
export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
        strict: false,
      });
    } catch (e) {
      console.warn('MathView render warning for:', math, e);
      return `<span class="font-mono">${math}</span>`;
    }
  }, [math, block]);

  return (
    <span
      className={`${block ? 'block my-1 text-center' : 'inline-block align-baseline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Parses mixed text containing inline LaTeX math like `$V_{dc}$` or renders plain text.
 */
export const MathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    const segments: Array<{ isMath: boolean; content: string }> = [];
    const regex = /\$([^$]+)\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          isMath: false,
          content: text.substring(lastIndex, match.index),
        });
      }
      segments.push({
        isMath: true,
        content: match[1],
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({
        isMath: false,
        content: text.substring(lastIndex),
      });
    }

    return segments;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.isMath ? (
          <MathView key={i} math={p.content} />
        ) : (
          <span key={i}>{p.content}</span>
        )
      )}
    </span>
  );
};
