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
}
