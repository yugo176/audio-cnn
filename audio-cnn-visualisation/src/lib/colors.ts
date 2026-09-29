type RGB = [number, number, number];

const lerp = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// Divergente : magenta (négatif) → fond sombre (0) → cyan (positif)
export const NEGATIVE: RGB = [236, 72, 153];
export const NEUTRAL: RGB = [15, 17, 24];
export const POSITIVE: RGB = [34, 211, 238];

export const getColor = (value: number): RGB => {
  const v = Math.max(-1, Math.min(1, value));
  const t = Math.pow(Math.abs(v), 0.75);
  return v >= 0 ? lerp(NEUTRAL, POSITIVE, t) : lerp(NEUTRAL, NEGATIVE, t);
};

// Séquentielle pour le spectrogramme : nuit → violet → cyan → blanc
const SEQ_STOPS: RGB[] = [
  [8, 9, 14],
  [76, 29, 149],
  [168, 85, 247],
  [34, 211, 238],
  [240, 253, 255],
];

export const getSequentialColor = (t: number): RGB => {
  const x = Math.max(0, Math.min(1, t)) * (SEQ_STOPS.length - 1);
  const i = Math.min(Math.floor(x), SEQ_STOPS.length - 2);
  return lerp(SEQ_STOPS[i]!, SEQ_STOPS[i + 1]!, x - i);
};

const css = (c: RGB) => `rgb(${c.map(Math.round).join(",")})`;

export const DIVERGING_GRADIENT = `linear-gradient(to right, ${css(NEGATIVE)}, ${css(NEUTRAL)}, ${css(POSITIVE)})`;
export const SEQUENTIAL_GRADIENT = `linear-gradient(to right, ${SEQ_STOPS.map(css).join(", ")})`;
