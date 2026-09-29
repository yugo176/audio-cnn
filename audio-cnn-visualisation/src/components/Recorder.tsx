"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { encodeWav } from "~/lib/wav";

// Les clips ESC-50 font 5 s : on enregistre la même durée par défaut
const MAX_SECONDS = 5;
const METER_BARS = 24;

const Recorder = ({
  onRecorded,
  disabled,
}: {
  onRecorded: (file: File) => void;
  disabled: boolean;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array<number>(METER_BARS).fill(0));
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const start = async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Accès au micro refusé ou indisponible.");
      return;
    }

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    const bins = new Uint8Array(analyser.frequencyBinCount);

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    const startedAt = performance.now();
    // Minuteries plutôt que requestAnimationFrame : elles tournent aussi onglet en arrière-plan
    const step = Math.floor(bins.length / METER_BARS);
    const interval = setInterval(() => {
      analyser.getByteFrequencyData(bins);
      setLevels(Array.from({ length: METER_BARS }, (_, i) => (bins[i * step] ?? 0) / 255));
      setElapsed(Math.min((performance.now() - startedAt) / 1000, MAX_SECONDS));
    }, 50);
    const timeout = setTimeout(stop, MAX_SECONDS * 1000);

    const cleanup = () => {
      clearInterval(interval);
      clearTimeout(timeout);
      stream.getTracks().forEach((t) => t.stop());
      void audioCtx.close();
      cleanupRef.current = null;
    };
    cleanupRef.current = cleanup;

    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      cleanup();
      setIsRecording(false);
      setLevels(new Array<number>(METER_BARS).fill(0));
      try {
        // Le navigateur enregistre en webm/ogg : on décode puis on réencode en WAV
        const raw = await new Blob(chunks).arrayBuffer();
        const decodeCtx = new AudioContext();
        const audioBuffer = await decodeCtx.decodeAudioData(raw);
        void decodeCtx.close();
        const stamp = new Date().toLocaleTimeString("fr-FR").replaceAll(":", "-");
        onRecorded(new File([encodeWav(audioBuffer)], `enregistrement-${stamp}.wav`, { type: "audio/wav" }));
      } catch {
        setError("Impossible de convertir l'enregistrement.");
      }
    };

    recorder.start();
    setElapsed(0);
    setIsRecording(true);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={isRecording ? stop : start}
          disabled={disabled && !isRecording}
          aria-label={isRecording ? "Arrêter l'enregistrement" : "Enregistrer avec le micro"}
          className={`group relative flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
            isRecording
              ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 hover:bg-fuchsia-400"
              : "border border-white/15 bg-white/5 text-zinc-200 hover:border-fuchsia-400/60 hover:bg-fuchsia-500/10"
          }`}
        >
          {isRecording ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-500/30" />
              <Square className="relative h-4 w-4" fill="currentColor" />
              <span className="relative">Arrêter</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 text-fuchsia-400" />
              Enregistrer avec le micro
            </>
          )}
        </button>

        {isRecording && (
          <span className="font-mono text-xs text-zinc-400">
            {elapsed.toFixed(1)} / {MAX_SECONDS}.0 s
          </span>
        )}
      </div>

      {isRecording && (
        <div className="w-full max-w-sm">
          <div className="flex h-10 items-end justify-center gap-1">
            {levels.map((l, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-fuchsia-500 to-cyan-400 transition-[height] duration-75"
                style={{ height: `${Math.max(8, l * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-fuchsia-500"
              style={{ width: `${(elapsed / MAX_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-fuchsia-300">{error}</p>}
    </div>
  );
};

export default Recorder;
