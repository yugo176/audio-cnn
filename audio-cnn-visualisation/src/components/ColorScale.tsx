const ColorScale = ({
  gradient,
  min,
  max,
  label,
}: {
  gradient: string;
  min: string;
  max: string;
  label?: string;
}) => (
  <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
    {label && <span className="uppercase tracking-widest">{label}</span>}
    <span>{min}</span>
    <div
      className="h-2.5 w-32 rounded-full ring-1 ring-white/10 sm:w-40"
      style={{ background: gradient }}
    />
    <span>{max}</span>
  </div>
);

export default ColorScale;
