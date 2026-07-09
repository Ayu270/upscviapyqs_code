'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

interface MathContentProps {
  content: string;
  className?: string;
}

export default function MathContent({ content, className }: MathContentProps) {
  const [rendered, setRendered] = useState(content);

  useEffect(() => {
    // Helper to render math formulas inside HTML
    const renderMathText = (htmlStr: string) => {
      const w = window as any;
      if (!w.katex || !htmlStr || htmlStr.indexOf('\\') < 0) return htmlStr;

      try {
        // Render display math: \[ ... \]
        let parsed = htmlStr.replace(/\\\[([\s\S]+?)\\\]/g, (match, expression) => {
          try {
            return w.katex.renderToString(expression, { displayMode: true, throwOnError: false });
          } catch (_) {
            return match;
          }
        });

        // Render inline math: \( ... \)
        parsed = parsed.replace(/\\\(([\s\S]+?)\\\)/g, (match, expression) => {
          try {
            return w.katex.renderToString(expression, { displayMode: false, throwOnError: false });
          } catch (_) {
            return match;
          }
        });

        return parsed;
      } catch (err) {
        console.error('Math parsing error:', err);
        return htmlStr;
      }
    };

    // Retry rendering math in case window.katex script loads late
    const interval = setInterval(() => {
      const w = window as any;
      if (w.katex) {
        setRendered(renderMathText(content));
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [content]);

  return (
    <Box
      className={className}
      dangerouslySetInnerHTML={{ __html: rendered }}
      sx={{
        '& p': { margin: '0 0 10px 0' },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          my: 2,
          fontSize: '13.5px',
          display: 'block',
          overflowX: 'auto',
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          p: 1,
          textAlign: 'left',
          verticalAlign: 'top',
        },
        '& th': {
          bgcolor: 'rgba(0,0,0,0.02)',
          fontWeight: 700,
        },
      }}
    />
  );
}
