import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renderiza texto plano que puede contener fórmulas LaTeX delimitadas por $...$
 * como fórmulas inline reales (KaTeX), dejando el resto como texto normal.
 */
export default function MathText({ text, className }) {
  const parts = useMemo(() => {
    if (!text) return [];
    return text.split(/(\$[^$]+\$)/g).map((chunk, i) => {
      if (chunk.startsWith('$') && chunk.endsWith('$') && chunk.length > 1) {
        const tex = chunk.slice(1, -1);
        try {
          const html = katex.renderToString(tex, { throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <span key={i}>{chunk}</span>;
        }
      }
      return <React.Fragment key={i}>{chunk}</React.Fragment>;
    });
  }, [text]);

  return <span className={className}>{parts}</span>;
}
