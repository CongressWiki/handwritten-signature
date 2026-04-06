import type { HTMLAttributes } from 'react';

export interface GlyphDefinition {
  path: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

export interface GlyphLayoutConfig {
  marginLeft?: number;
  marginRight?: number;
  baselineShift?: number;
  dashLength?: number;
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
