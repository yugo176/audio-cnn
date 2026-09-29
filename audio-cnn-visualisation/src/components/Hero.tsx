import { AudioWaveform, BrainCircuit, ChevronRight, Grid3x3, Target } from "lucide-react";

const STEPS = [
  {
    icon: AudioWaveform,
    title: "Son brut",
    detail: "WAV · 44,1 kHz",
    text: "Tu déposes un clip audio, quelques secondes suffisent.",
  },
  {
    icon: Grid3x3,
    title: "Spectrogramme Mel",
    detail: "128 bandes × temps",
    text: "Le son devient une image : fréquences en hauteur, temps en largeur.",
  },
  {
    icon: BrainCircuit,
    title: "ResNet-34",
    detail: "16 blocs résiduels",
    text: "Le CNN extrait des motifs de plus en plus abstraits, couche après couche.",
  },
  {
    icon: Target,
    title: "Prédiction",
    detail: "50 classes ESC-50",
    text: "Chien, pluie, sirène… avec un score de confiance pour chacune.",
  },
];

// Hauteurs pseudo-aléatoires mais stables (évite un mismatch d'hydratation)
const BARS = Array.from({ length: 48 }, (_, i) =>
  Math.round(20 + 70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43))),
);

export default function Hero() {
  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 px-6 py-12 sm:px-10 lg:py-16">
      {/* Égaliseur décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex h-40 items-end justify-between gap-1 px-4 opacity-25 [mask-image:linear-gradient(to_top,black,transparent)]"
      >
        {BARS.map((h, i) => (
          <span
            key={i}
            className="eq-bar w-full rounded-t-sm bg-gradient-to-t from-fuchsia-500 to-cyan-400"
            style={{ height: `${h}%`, animationDelay: `${(i % 12) * -0.15}s` }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-[11px] text-cyan-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          Réseau de neurones convolutif · entraîné sur 2 000 sons
        </span>
        <h2 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Regarde un réseau de neurones{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
            écouter
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-pretty text-zinc-400 sm:text-lg">
          Envoie un son : le modèle le transforme en image, le fait traverser
          ses couches de convolution et devine ce que c&apos;est. Chaque étape
          est affichée, pour voir ce que le réseau « voit » réellement.
        </p>
      </div>

      {/* Pipeline */}
      <ol className="relative mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, detail, text }, i) => (
          <li
            key={title}
            className="relative rounded-2xl border border-white/10 bg-zinc-950/70 p-5 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-400/40"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 ring-1 ring-white/10">
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
              <span className="font-mono text-xs text-zinc-600">
                0{i + 1}
              </span>
            </div>
            <h3 className="font-medium text-zinc-100">{title}</h3>
            <p className="font-mono text-[11px] text-cyan-400/80">{detail}</p>
            <p className="mt-2 text-sm text-zinc-400">{text}</p>
            {i < STEPS.length - 1 && (
              <ChevronRight
                aria-hidden
                className="absolute top-1/2 -right-3 z-10 hidden h-5 w-5 -translate-y-1/2 text-zinc-600 lg:block"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
