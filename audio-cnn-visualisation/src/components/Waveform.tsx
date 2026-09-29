"use client";

import { useMemo } from "react";

const WIDTH = 1000;
const HEIGHT = 200;
const COLUMNS = 200;

const Waveform = ({
  data,
  progress = 0,
  onSeek,
}: {
  data: number[];
  progress?: number;
  onSeek?: (fraction: number) => void;
}) => {
  // Enveloppe min/max par colonne : plus lisible qu'une polyligne brute
  const bars = useMemo(() => {
    const valid = data.filter((v) => Number.isFinite(v));
    if (valid.length === 0) return [];
    const peak = valid.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1;
    const per = Math.max(1, Math.floor(valid.length / COLUMNS));
    return Array.from({ length: COLUMNS }, (_, c) => {
      let lo = 0;
      let hi = 0;
      for (let k = c * per; k < Math.min((c + 1) * per, valid.length); k++) {
        lo = Math.min(lo, valid[k]!);
        hi = Math.max(hi, valid[k]!);
      }
      return { lo: lo / peak, hi: hi / peak };
    });
  }, [data]);

  if (bars.length === 0) return null;
  const colW = WIDTH / bars.length;
  const mid = HEIGHT / 2;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="block h-40 w-full cursor-pointer"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek?.((e.clientX - rect.left) / rect.width);
      }}
    >
      <defs>
        <linearGradient id="wave-played" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <line x1={0} x2={WIDTH} y1={mid} y2={mid} stroke="#27272a" />
      {bars.map(({ lo, hi }, i) => (
        <rect
          key={i}
          x={i * colW + colW * 0.2}
          y={mid - hi * mid * 0.95}
          width={colW * 0.6}
          height={Math.max(2, (hi - lo) * mid * 0.95)}
          fill={i / bars.length < progress ? "url(#wave-played)" : "#3f3f46"}
        />
      ))}
      {progress > 0 && progress < 1 && (
        <line
          x1={progress * WIDTH}
          x2={progress * WIDTH}
          y1={0}
          y2={HEIGHT}
          stroke="#f0fdff"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
};

export default Waveform;
