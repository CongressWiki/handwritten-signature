import type { GlyphLayoutConfig } from './types';

export const CODEPEN_BASE_LETTER_HEIGHT = 51;
export const SPACE_SCALING = 12 / 51;
export const MISSING_GLYPH_SCALING = 0.28;
export const FALLBACK_TEXT = 'Signature';
export const DEFAULT_INITIAL_DELAY_MS = 300;

export const TIMING_OVERLAP_MULTIPLIER = 0.7;
export const MIN_DURATION_MULTIPLIER = 0.7;
export const DURATION_BASE_OFFSET = 0.85;
export const DURATION_DASH_MULTIPLIER = 0.45;
export const SPACE_DELAY_MULTIPLIER = 0.35;

export const FALLBACK_GLYPH_LAYOUT: GlyphLayoutConfig = {
  marginLeft: -4,
  marginRight: -6,
  dashLength: 200,
};

// Dash lengths must be >= actual SVG path length at viewBox scale.
// Values here are measured via getTotalLength() and padded 30% to
// ensure coverage at any letterHeight (the scale factor can reduce
// the computed dashLength below the rendered path length otherwise).
export const UPPERCASE_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  A: { marginLeft: -4, marginRight: -6, dashLength: 200 },
  B: { marginLeft: -4, marginRight: -4, dashLength: 250 },
  C: { marginLeft: -6, marginRight: -5, dashLength: 135 },
  D: { marginLeft: -4, marginRight: -6, dashLength: 200 },
  E: { marginLeft: -8, marginRight: -10, dashLength: 175 },
  F: { marginLeft: -4, marginRight: -8, dashLengths: [155, 50] },
  G: { marginLeft: -6, marginRight: 0, dashLength: 190 },
  H: { marginLeft: -4, marginRight: -6, dashLength: 180 },
  I: { marginLeft: -6, marginRight: -8, dashLengths: [65, 40] },
  J: { marginLeft: -6, marginRight: -24, dashLength: 230 },
  K: { marginLeft: -4, marginRight: -6, dashLength: 205 },
  L: { marginLeft: -5, marginRight: -7, dashLength: 110 },
  M: { marginLeft: -10, marginRight: -7, dashLength: 230 },
  N: { marginLeft: -10, marginRight: -4, dashLength: 145 },
  O: { marginLeft: -1, marginRight: -1, dashLength: 220 },
  P: { marginLeft: -4, marginRight: -6, dashLength: 200 },
  Q: { marginLeft: -3, marginRight: -3, dashLength: 275 },
  R: { marginLeft: -4, marginRight: -6, dashLength: 205 },
  S: { marginLeft: -2, marginRight: -14, dashLength: 130 },
  T: { marginLeft: -6, marginRight: -10, dashLengths: [65, 70] },
  U: { marginLeft: -1, marginRight: -10, dashLength: 180 },
  V: { marginLeft: -6, marginRight: -15, dashLength: 130 },
  W: { marginLeft: -6, marginRight: -8, dashLength: 215 },
  X: { marginLeft: -4, marginRight: -4, dashLengths: [70, 70] },
  Y: { marginLeft: 2, marginRight: -12, dashLength: 215 },
  Z: { marginLeft: -8, marginRight: -9, dashLength: 200 },
};

export const LOWERCASE_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  a: { marginLeft: 0, marginRight: -4, dashLength: 48 },
  b: { marginLeft: -1.5, marginRight: -6, dashLength: 85 },
  c: { marginLeft: 0, marginRight: -4, dashLength: 22 },
  d: { marginLeft: 0, marginRight: -11.3, dashLength: 95 },
  e: { marginLeft: 0, marginRight: -4, dashLength: 30 },
  f: { marginLeft: -2, marginRight: -4, dashLengths: [55, 20] },
  g: { marginLeft: -10, marginRight: -4, dashLength: 100 },
  h: { marginLeft: -1, marginRight: -4, dashLength: 65 },
  i: { marginLeft: 0, marginRight: -3.5, dashLength: 20 },
  j: { marginLeft: -14, marginRight: -5, dashLength: 80 },
  k: { marginLeft: -2, marginRight: -4, dashLength: 88 },
  l: { marginLeft: -4, marginRight: -12, dashLength: 45 },
  m: { marginLeft: 0, marginRight: -5, dashLength: 58 },
  n: { marginLeft: 0, marginRight: -5, dashLength: 36 },
  o: { marginLeft: 0, marginRight: -2.5, dashLength: 22 },
  p: { marginLeft: -2, marginRight: -3, dashLength: 88 },
  q: { marginLeft: -6, marginRight: -2, dashLength: 85 },
  r: { marginLeft: -1, marginRight: -3, dashLength: 30 },
  s: { marginLeft: -4, marginRight: -4, dashLength: 42 },
  t: { marginLeft: -2, marginRight: -6, dashLengths: [48, 24] },
  u: { marginLeft: 0, marginRight: -4.5, dashLength: 38 },
  v: { marginLeft: 0, marginRight: -4.5, dashLength: 24 },
  w: { marginLeft: 0, marginRight: -4, dashLength: 28 },
  x: { marginLeft: 0, marginRight: -3, dashLengths: [16, 16] },
  y: { marginLeft: -9, marginRight: -4, dashLength: 92 },
  z: { marginLeft: -10, marginRight: -4, dashLength: 88 },
};

export const SYMBOL_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  '.': { marginLeft: -1, marginRight: -1, dashLength: 8 },
  '-': { marginLeft: -2, marginRight: -6, dashLength: 58 },
  "'": { marginLeft: -1, marginRight: -4, dashLength: 24 },
  '\u2019': { marginLeft: -1, marginRight: -4, dashLength: 24 },
};
