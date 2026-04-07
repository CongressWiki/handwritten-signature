import type { HTMLAttributes } from 'react';

export interface GlyphDefinition {
  /** Single stroke path (use `paths` for multi-stroke glyphs) */
  path?: string;
  /** Multiple stroke paths, animated sequentially (e.g. stem then crossbar) */
  paths?: string[];
  viewBoxWidth: number;
  viewBoxHeight: number;
}

export interface GlyphLayoutConfig {
  marginLeft?: number;
  marginRight?: number;
  baselineShift?: number;
  /** Dash length for single-stroke glyphs */
  dashLength?: number;
  /** Dash lengths per stroke for multi-stroke glyphs */
  dashLengths?: number[];
}

export interface HandwrittenSignatureProps
  extends HTMLAttributes<HTMLDivElement> {
  text?: string;
  letterSpacing?: number;
  letterHeight?: number;
  durationPerLetterMs?: number;
  initialDelayMs?: number;
  strokeWidth?: number;
  overlapRatio?: number;
  /** CSS timing function for each glyph's stroke animation.
   *  Default: 'cubic-bezier(0.33, 1, 0.68, 1)' (ease-out) */
  easing?: string;
  /** Writing speed variation across the signature (0–1).
   *  0 = constant speed, higher = more natural slow-fast-slow pacing.
   *  Default: 0 */
  tempoVariation?: number;
  /** Stroke width variation across the signature simulating pen pressure (0–1).
   *  0 = uniform width, higher = more variation (thicker in middle, thinner at edges).
   *  Default: 0 */
  pressureVariation?: number;
}
