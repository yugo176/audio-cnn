"use client";

import { AudioLines, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const DropZone = ({
  onFile,
  isLoading,
  fileName,
}: {
  onFile: (file: File) => void;
  isLoading: boolean;
  fileName?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (file?: File) => {
    if (file && !isLoading) onFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-busy={isLoading}
      onClick={() => !isLoading && inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files[0]);
      }}
      className={`relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dashed px-6 py-10 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        dragging
          ? "border-cyan-400 bg-cyan-400/10"
          : "border-white/15 bg-white/[0.02] hover:border-cyan-400/60 hover:bg-white/[0.04]"
      } ${isLoading ? "cursor-wait" : "cursor-pointer"}`}
    >
      <input
        ref={inputRef}
        id="file-upload"
        type="file"
        accept=".wav,audio/wav"
        className="hidden"
        disabled={isLoading}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 ring-1 ring-white/10">
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
        ) : fileName ? (
          <AudioLines className="h-6 w-6 text-cyan-300" />
        ) : (
          <Upload className="h-6 w-6 text-cyan-300" />
        )}
      </div>
      <div>
        <p className="text-base font-medium text-zinc-100">
          {isLoading
            ? "Analyse en cours…"
            : fileName
              ? "Déposer un autre fichier"
              : "Glisse un fichier WAV ici ou clique pour parcourir"}
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          {fileName ?? "ESC-50 · 50 classes de sons · clips de 5 s"}
        </p>
      </div>
      {isLoading && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-white/5">
          <div className="scan-bar h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default DropZone;
