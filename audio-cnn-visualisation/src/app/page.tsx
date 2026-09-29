"use client";

import { Activity, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ColorScale from "~/components/ColorScale";
import DropZone from "~/components/DropZone";
import FeatureMap from "~/components/FeatureMap";
import Hero from "~/components/Hero";
import Recorder from "~/components/Recorder";
import Waveform from "~/components/Waveform";
import { env } from "~/env";
import { getClassInfo } from "~/lib/classes";
import { DIVERGING_GRADIENT, SEQUENTIAL_GRADIENT } from "~/lib/colors";

interface Prediction {
  class: string;
  confidence: number;
}

interface LayerData {
  shape: number[];
  values: number[][];
}

type VisualizationData = Record<string, LayerData>;

interface WaveformData {
  values: number[];
  sample_rate: number;
  duration: number;
}

interface ApiResponse {
  predictions: Prediction[];
  visualization: VisualizationData;
  input_spectrogram: LayerData;
  waveform: WaveformData;
}

const LAYER_INFO: Record<string, string> = {
  conv1: "Conv 7×7 · 64 canaux",
  layer1: "3 blocs résiduels · 64 canaux",
  layer2: "4 blocs résiduels · 128 canaux",
  layer3: "6 blocs résiduels · 256 canaux",
  layer4: "3 blocs résiduels · 512 canaux",
};

function splitLayers(visualization: VisualizationData) {
  const main: [string, LayerData][] = [];
  const internals: Record<string, [string, LayerData][]> = {};

  for (const [name, data] of Object.entries(visualization)) {
    if (!name.includes(".")) {
      main.push([name, data]);
    } else {
      const [parent] = name.split(".");
      if (parent === undefined) continue;
      (internals[parent] ??= []).push([name, data]);
    }
  }

  return { main, internals };
}

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Impossible de lire le fichier."));
    reader.readAsDataURL(file);
  });

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-zinc-900/60 p-5 shadow-2xl shadow-black/40 backdrop-blur ${className}`}
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 font-mono text-[11px] text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export default function HomePage() {
  const [vizData, setVizData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const [audioUrl, setAudioUrl] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Défilement vers les résultats dès qu'ils arrivent
  useEffect(() => {
    if (!vizData) return;
    // Défilement instantané si l'onglet est en arrière-plan (le mode smooth y est ignoré)
    const instant =
      document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ behavior: instant ? "auto" : "smooth", block: "start" });
  }, [vizData]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Tête de lecture fluide pendant la lecture
  useEffect(() => {
    if (!isPlaying) return;
    let frame: number;
    const tick = () => {
      setCurrentTime(audioRef.current?.currentTime ?? 0);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setIsLoading(true);
    setError(null);
    setVizData(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioUrl(URL.createObjectURL(file));

    try {
      const audioData = await readAsBase64(file);
      const response = await fetch(env.NEXT_PUBLIC_INFERENCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_data: audioData }),
      });

      if (!response.ok) {
        throw new Error(`Erreur de l'API (${response.status})`);
      }

      setVizData((await response.json()) as ApiResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const seek = (fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = fraction * duration;
    setCurrentTime(audio.currentTime);
  };

  const { main, internals } = vizData
    ? splitLayers(vizData.visualization)
    : { main: [], internals: {} };

  const top = vizData?.predictions[0];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.10),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        {/* En-tête */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 shadow-lg shadow-cyan-500/20">
              <Activity className="h-5 w-5 text-zinc-950" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Audio CNN <span className="text-zinc-500">Visualiseur</span>
              </h1>
              <p className="font-mono text-[11px] text-zinc-500">
                Ce que le réseau « entend », couche par couche
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 font-mono text-[11px]">
            {["ResNet-34", "ESC-50", "Mel 128"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <Hero />

        <DropZone onFile={handleFile} isLoading={isLoading} fileName={fileName} />

        <div className="my-5 flex items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-zinc-600">
          <span className="h-px flex-1 bg-white/10" />
          ou
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Recorder onRecorded={handleFile} disabled={isLoading} />

        {isLoading && (
          <p className="mt-3 text-center font-mono text-xs text-zinc-500">
            Le premier appel peut prendre ~20 s le temps que le serveur démarre.
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-200">
            {error}
          </div>
        )}

        {vizData && (
          <div ref={resultsRef} className="mt-8 scroll-mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Prédictions */}
              <Panel title="Prédictions" subtitle="Top 3 · softmax" className="lg:col-span-2">
                {top && (
                  <div className="mb-5 flex items-center gap-4 rounded-xl bg-gradient-to-r from-cyan-400/15 to-fuchsia-500/10 p-4 ring-1 ring-cyan-400/20">
                    <span className="text-5xl leading-none">
                      {getClassInfo(top.class).emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-semibold">
                        {getClassInfo(top.class).label}
                      </p>
                      <p className="font-mono text-sm text-cyan-300">
                        {(top.confidence * 100).toFixed(1)} % de confiance
                      </p>
                    </div>
                  </div>
                )}
                <ol className="space-y-3">
                  {vizData.predictions.slice(0, 3).map((pred, i) => {
                    const { emoji, label } = getClassInfo(pred.class);
                    return (
                      <li key={pred.class}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="text-zinc-300">
                            <span className="mr-2 font-mono text-zinc-600">
                              {i + 1}
                            </span>
                            {emoji} {label}
                          </span>
                          <span className="font-mono text-zinc-400">
                            {(pred.confidence * 100).toFixed(1)} %
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              i === 0
                                ? "bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                                : "bg-zinc-600"
                            }`}
                            style={{ width: `${pred.confidence * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Panel>

              {/* Forme d'onde + lecteur */}
              <Panel
                title="Forme d'onde"
                subtitle={`${vizData.waveform.duration.toFixed(2)} s · ${vizData.waveform.sample_rate} Hz`}
                className="lg:col-span-3"
              >
                <Waveform
                  data={vizData.waveform.values}
                  progress={duration ? currentTime / duration : 0}
                  onSeek={seek}
                />
                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    disabled={!audioUrl}
                    aria-label={isPlaying ? "Pause" : "Lecture"}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300 disabled:opacity-40"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" fill="currentColor" />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                    )}
                  </button>
                  <span className="font-mono text-xs text-zinc-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <span className="ml-auto truncate font-mono text-xs text-zinc-600">
                    {fileName}
                  </span>
                </div>
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="metadata"
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                  />
                )}
              </Panel>
            </div>

            {/* Spectrogramme */}
            <Panel
              title="Spectrogramme Mel d'entrée"
              subtitle={`${vizData.input_spectrogram.shape.join(" × ")} · bandes Mel × trames`}
              action={
                <ColorScale gradient={SEQUENTIAL_GRADIENT} min="faible" max="fort" label="dB" />
              }
            >
              <FeatureMap data={vizData.input_spectrogram.values} variant="spectrogram" />
            </Panel>

            {/* Couches */}
            <Panel
              title="Activations des couches"
              subtitle="Moyenne sur les canaux · normalisée par couche"
              action={<ColorScale gradient={DIVERGING_GRADIENT} min="−1" max="+1" />}
            >
              <div className="space-y-4">
                {main.map(([name, data], idx) => (
                  <div
                    key={name}
                    className="grid gap-4 rounded-xl border border-white/5 bg-black/20 p-4 md:grid-cols-[minmax(0,280px)_1fr]"
                  >
                    <div>
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="font-mono text-xs text-cyan-400">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-medium">{name}</h3>
                      </div>
                      <FeatureMap data={data.values} title={`${data.shape.join(" × ")} · ${LAYER_INFO[name] ?? ""}`} />
                    </div>
                    {internals[name] && (
                      <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {internals[name]
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([layerName, layerData]) => (
                            <FeatureMap
                              key={layerName}
                              data={layerData.values}
                              title={layerName.replace(`${name}.`, "")}
                              variant="internal"
                            />
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        <footer className="mt-12 text-center font-mono text-[11px] text-zinc-600">
          Inférence sur Modal · PyTorch · Next.js
        </footer>
      </div>
    </main>
  );
}
