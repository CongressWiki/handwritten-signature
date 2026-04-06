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
  dashLength: 140,
};

export const UPPERCASE_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  A: { marginLeft: -4, marginRight: -6, dashLength: 160 },
  B: { marginLeft: -4, marginRight: -4, dashLength: 180 },
  C: { marginLeft: -6, marginRight: -5, dashLength: 101 },
  D: { marginLeft: -4, marginRight: -6, dashLength: 160 },
  E: { marginLeft: -8, marginRight: -10, dashLength: 132 },
  F: { marginLeft: -4, marginRight: -8, dashLengths: [140, 50] },
  G: { marginLeft: -6, marginRight: 0, dashLength: 145 },
  H: { marginLeft: -4, marginRight: -6, dashLength: 150 },
  I: { marginLeft: -6, marginRight: -8, dashLengths: [100, 50] },
  J: { marginLeft: -6, marginRight: -24, dashLength: 174 },
  K: { marginLeft: -4, marginRight: -6, dashLength: 180 },
  L: { marginLeft: -5, marginRight: -7, dashLength: 83 },
  M: { marginLeft: -10, marginRight: -7, dashLength: 176 },
  N: { marginLeft: -10, marginRight: -4, dashLength: 111 },
  O: { marginLeft: -1, marginRight: -1, dashLength: 167 },
  P: { marginLeft: -4, marginRight: -6, dashLength: 160 },
  Q: { marginLeft: -3, marginRight: -3, dashLength: 212 },
  R: { marginLeft: -4, marginRight: -6, dashLength: 170 },
  S: { marginLeft: -2, marginRight: -14, dashLength: 100 },
  T: { marginLeft: -6, marginRight: -10, dashLengths: [90, 80] },
  U: { marginLeft: -1, marginRight: -10, dashLength: 136 },
  V: { marginLeft: -6, marginRight: -15, dashLength: 100 },
  W: { marginLeft: -6, marginRight: -8, dashLength: 163 },
  X: { marginLeft: -4, marginRight: -4, dashLengths: [60, 60] },
  Y: { marginLeft: 2, marginRight: -12, dashLength: 162 },
  Z: { marginLeft: -8, marginRight: -9, dashLength: 149 },
};

export const LOWERCASE_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  a: { marginLeft: 0, marginRight: -4, dashLength: 36 },
  b: { marginLeft: -1.5, marginRight: -6, dashLength: 64 },
  c: { marginLeft: 0, marginRight: -4, dashLength: 17 },
  d: { marginLeft: 0, marginRight: -11.3, dashLength: 73 },
  e: { marginLeft: 0, marginRight: -4, dashLength: 22 },
  f: { marginLeft: -2, marginRight: -4, dashLengths: [50, 20] },
  g: { marginLeft: -10, marginRight: -4, dashLength: 75 },
  h: { marginLeft: -1, marginRight: -4, dashLength: 48 },
  i: { marginLeft: 0, marginRight: -3.5, dashLength: 16 },
  j: { marginLeft: -14, marginRight: -5, dashLength: 59 },
  k: { marginLeft: -2, marginRight: -4, dashLength: 50 },
  l: { marginLeft: -4, marginRight: -12, dashLength: 33 },
  m: { marginLeft: 0, marginRight: -5, dashLength: 43 },
  n: { marginLeft: 0, marginRight: -5, dashLength: 27 },
  o: { marginLeft: 0, marginRight: -2.5, dashLength: 17 },
  p: { marginLeft: -2, marginRight: -3, dashLength: 60 },
  q: { marginLeft: -6, marginRight: -2, dashLength: 63 },
  r: { marginLeft: -1, marginRight: -3, dashLength: 24 },
  s: { marginLeft: -4, marginRight: -4, dashLength: 32 },
  t: { marginLeft: -2, marginRight: -6, dashLengths: [50, 25] },
  u: { marginLeft: 0, marginRight: -4.5, dashLength: 28 },
  v: { marginLeft: 0, marginRight: -4.5, dashLength: 17 },
  w: { marginLeft: 0, marginRight: -4, dashLength: 21 },
  x: { marginLeft: 0, marginRight: -3, dashLengths: [14, 14] },
  y: { marginLeft: -9, marginRight: -4, dashLength: 70 },
  z: { marginLeft: -10, marginRight: -4, dashLength: 67 },
};

export const SYMBOL_GLYPH_LAYOUT: Record<string, GlyphLayoutConfig> = {
  '.': { marginLeft: -1, marginRight: -1, dashLength: 8 },
  '-': { marginLeft: -2, marginRight: -6, dashLength: 58 },
  "'": { marginLeft: -1, marginRight: -4, dashLength: 24 },
  '\u2019': { marginLeft: -1, marginRight: -4, dashLength: 24 },
};
