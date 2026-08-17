'use client';

import { useEffect, useRef } from 'react';

interface BarVizProps {
  val: number;
  maxW?: number;
  fillColor?: string;
}

export default function BarViz({ val, maxW = 180, fillColor = 'var(--d-accent)' }: BarVizProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.width = Math.round((val / 100) * maxW) + 'px';
    }
  }, [val, maxW]);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: maxW,
          height: 6,
          background: 'var(--d-line)',
          position: 'relative',
          overflow: 'hidden',
          display: 'inline-block',
        }}
      >
        <span
          ref={fillRef}
          className="bar-fill"
          style={{ position: 'absolute', left: 0, top: 0, width: 0, height: '100%', background: fillColor }}
        />
      </span>
      <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: 'var(--d-ink)', minWidth: 34 }}>{val}%</span>
    </span>
  );
}
