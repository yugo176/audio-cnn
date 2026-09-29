"use client";

import { useEffect, useRef } from "react";
import { getColor, getSequentialColor } from "~/lib/colors";

const FeatureMap = ({
  data,
  title,
  variant = "layer",
}: {
  data: number[][];
  title?: string;
  variant?: "layer" | "internal" | "spectrogram";
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const height = data?.length ?? 0;
  const width = data?.[0]?.length ?? 0;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !width || !height) return;

    let lo = Infinity;
    let hi = -Infinity;
    let absMax = 0;
    for (const row of data) {
      for (const raw of row) {
        const v = Number.isFinite(raw) ? raw : 0;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
        absMax = Math.max(absMax, Math.abs(v));
      }
    }

    const img = ctx.createImageData(width, height);
    for (let i = 0; i < height; i++) {
      // Basses fréquences en bas : on inverse l'axe vertical
      const row = data[height - 1 - i]!;
      for (let j = 0; j < width; j++) {
        const v = Number.isFinite(row[j]) ? row[j]! : 0;
        const [r, g, b] =
          variant === "spectrogram"
            ? getSequentialColor(hi === lo ? 0 : (v - lo) / (hi - lo))
            : getColor(absMax === 0 ? 0 : v / absMax);
        const k = (i * width + j) * 4;
        img.data[k] = r;
        img.data[k + 1] = g;
        img.data[k + 2] = b;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [data, width, height, variant]);

  if (!width || !height) return null;

  return (
    <figure className="group min-w-0">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`block w-full rounded-md bg-zinc-950 ring-1 ring-white/10 transition group-hover:ring-cyan-400/50 ${
          variant === "spectrogram" ? "h-56" : "aspect-[3/1]"
        }`}
        style={{
          imageRendering: variant === "spectrogram" ? "auto" : "pixelated",
        }}
      />
      {title && (
        <figcaption className="mt-1.5 truncate font-mono text-[10px] text-zinc-500">
          {title}
        </figcaption>
      )}
    </figure>
  );
};

export default FeatureMap;
