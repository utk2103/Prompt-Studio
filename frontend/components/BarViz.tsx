'use client';

import { useEffect, useRef } from 'react';

interface BarVizProps {
  val: number;
  maxW?: number;
  fillColor?: string;
}

export default function BarViz({ val, maxW = 158, fillColor = '#00cc44' }: BarVizProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fillRef.current) {
      fillRef.current.style.width = Math.round((val / 100) * maxW) + 'px';
    }
  }, [val, maxW]);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: maxW,
          height: 7,
          background: '#004411',
          border: '1px solid #003311',
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
      <span style={{ color: fillColor, fontSize: 11, width: 34 }}>{val}%</span>
    </span>
  );
}
