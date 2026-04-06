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

// Dash lengths measured from actual SVG path.getTotalLength() + buffer
export const UPPERCASE_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  A: { marginLeft: -4, marginRight: -6, dashLength: 155 },
  B: { marginLeft: -4, marginRight: -4, dashLength: 200 },
  C: { marginLeft: -6, marginRight: -5, dashLength: 110 },
  D: { marginLeft: -4, marginRight: -6, dashLength: 160 },
  E: { marginLeft: -8, marginRight: -10, dashLength: 140 },
  F: { marginLeft: -4, marginRight: -8, dashLengths: [125, 40] },
  G: { marginLeft: -6, marginRight: 0, dashLength: 150 },
  H: { marginLeft: -4, marginRight: -6, dashLength: 145 },
  I: { marginLeft: -6, marginRight: -8, dashLengths: [55, 35] },
  J: { marginLeft: -6, marginRight: -24, dashLength: 180 },
  K: { marginLeft: -4, marginRight: -6, dashLength: 160 },
  L: { marginLeft: -5, marginRight: -7, dashLength: 90 },
  M: { marginLeft: -10, marginRight: -7, dashLength: 180 },
  N: { marginLeft: -10, marginRight: -4, dashLength: 115 },
  O: { marginLeft: -1, marginRight: -1, dashLength: 175 },
  P: { marginLeft: -4, marginRight: -6, dashLength: 160 },
  Q: { marginLeft: -3, marginRight: -3, dashLength: 220 },
  R: { marginLeft: -4, marginRight: -6, dashLength: 165 },
  S: { marginLeft: -2, marginRight: -14, dashLength: 105 },
  T: { marginLeft: -6, marginRight: -10, dashLengths: [55, 55] },
  U: { marginLeft: -1, marginRight: -10, dashLength: 140 },
  V: { marginLeft: -6, marginRight: -15, dashLength: 105 },
  W: { marginLeft: -6, marginRight: -8, dashLength: 170 },
  X: { marginLeft: -4, marginRight: -4, dashLengths: [55, 55] },
  Y: { marginLeft: 2, marginRight: -12, dashLength: 170 },
  Z: { marginLeft: -8, marginRight: -9, dashLength: 155 },
};

export const LOWERCASE_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  a: { marginLeft: 0, marginRight: -4, dashLength: 40 },
  b: { marginLeft: -1.5, marginRight: -6, dashLength: 70 },
  c: { marginLeft: 0, marginRight: -4, dashLength: 20 },
  d: { marginLeft: 0, marginRight: -11.3, dashLength: 80 },
  e: { marginLeft: 0, marginRight: -4, dashLength: 28 },
  f: { marginLeft: -2, marginRight: -4, dashLengths: [45, 18] },
  g: { marginLeft: -10, marginRight: -4, dashLength: 80 },
  h: { marginLeft: -1, marginRight: -4, dashLength: 52 },
  i: { marginLeft: 0, marginRight: -3.5, dashLength: 20 },
  j: { marginLeft: -14, marginRight: -5, dashLength: 65 },
  k: { marginLeft: -2, marginRight: -4, dashLength: 70 },
  l: { marginLeft: -4, marginRight: -12, dashLength: 38 },
  m: { marginLeft: 0, marginRight: -5, dashLength: 48 },
  n: { marginLeft: 0, marginRight: -5, dashLength: 32 },
  o: { marginLeft: 0, marginRight: -2.5, dashLength: 20 },
  p: { marginLeft: -2, marginRight: -3, dashLength: 72 },
  q: { marginLeft: -6, marginRight: -2, dashLength: 68 },
  r: { marginLeft: -1, marginRight: -3, dashLength: 28 },
  s: { marginLeft: -4, marginRight: -4, dashLength: 36 },
  t: { marginLeft: -2, marginRight: -6, dashLengths: [40, 22] },
  u: { marginLeft: 0, marginRight: -4.5, dashLength: 32 },
  v: { marginLeft: 0, marginRight: -4.5, dashLength: 22 },
  w: { marginLeft: 0, marginRight: -4, dashLength: 25 },
  x: { marginLeft: 0, marginRight: -3, dashLengths: [14, 14] },
  y: { marginLeft: -9, marginRight: -4, dashLength: 75 },
  z: { marginLeft: -10, marginRight: -4, dashLength: 72 },
};

export const SYMBOL_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  '.': { marginLeft: -1, marginRight: -1, dashLength: 8 },
  '-': { marginLeft: -2, marginRight: -6, dashLength: 58 },
  "'": { marginLeft: -1, marginRight: -4, dashLength: 24 },
  '\u2019': { marginLeft: -1, marginRight: -4, dashLength: 24 },
};
