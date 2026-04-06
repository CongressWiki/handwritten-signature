import type { CSSProperties, ReactNode } from 'react';
import type { HandwrittenSignatureProps } from './types';
import { SIGNATURE_GLYPHS } from './glyphs';
import { CSS, STYLE_ID } from './styles';
import {
  CODEPEN_BASE_LETTER_HEIGHT,
  DEFAULT_INITIAL_DELAY_MS,
  DURATION_BASE_OFFSET,
  DURATION_DASH_MULTIPLIER,
  FALLBACK_GLYPH_LAYOUT,
  FALLBACK_TEXT,
  LOWERCASE_GLYPH_LAYOUT,
  MIN_DURATION_MULTIPLIER,
  MISSING_GLYPH_SCALING,
  SPACE_DELAY_MULTIPLIER,
  SPACE_SCALING,
  SYMBOL_GLYPH_LAYOUT,
  TIMING_OVERLAP_MULTIPLIER,
  UPPERCASE_GLYPH_LAYOUT,
} from './layout';

interface BuildGlyphOptions {
  text: string | undefined;
  letterSpacing: number;
  letterHeight: number;
  durationPerLetterMs: number;
  initialDelayMs: number;
  overlapRatio: number;
  strokeWidth: number;
}

const formatPx = (value: number) => `${value.toFixed(2)}px`;
const formatUnitless = (value: number) =>
  Number.isFinite(value) ? Number(value.toFixed(2)).toString() : '0';

const buildGlyphElements = ({
  text,
  letterSpacing,
  letterHeight,
  durationPerLetterMs,
  initialDelayMs,
  overlapRatio,
  strokeWidth,
}: BuildGlyphOptions): ReactNode[] => {
  const normalizedText = text?.trim().length ? text : FALLBACK_TEXT;
  const characters = Array.from(normalizedText);
  const glyphElements: ReactNode[] = [];

  const normalizedLetterHeight =
    letterHeight > 0 ? letterHeight : CODEPEN_BASE_LETTER_HEIGHT;
  const scale = normalizedLetterHeight / CODEPEN_BASE_LETTER_HEIGHT;

  const letterHeightPx = formatPx(normalizedLetterHeight);
  const spaceWidth = normalizedLetterHeight * SPACE_SCALING;
  const spaceWidthPx = formatPx(spaceWidth);
  const missingGlyphWidth = Math.max(
    normalizedLetterHeight * MISSING_GLYPH_SCALING,
    letterSpacing,
  );
  const missingGlyphWidthPx = formatPx(missingGlyphWidth);

  const requestedOverlap = overlapRatio ?? 0.58;
  const clampedTimelineOverlap = Math.max(0, Math.min(requestedOverlap, 0.9));
  const effectiveInitialDelayMs = Math.max(initialDelayMs, 0);

  let cumulativeDelay = 0;

  characters.forEach((char, index) => {
    if (char === ' ') {
      const spaceMarginRight = Math.max(
        letterSpacing,
        normalizedLetterHeight * 0.08,
      );
      glyphElements.push(
        <span
          key={`space-${index}`}
          className="hws-space"
          style={
            {
              '--hws-space-w': spaceWidthPx,
              '--hws-ml': formatPx(0),
              '--hws-mr': formatPx(spaceMarginRight),
            } as CSSProperties
          }
        />,
      );
      cumulativeDelay += durationPerLetterMs * SPACE_DELAY_MULTIPLIER;
      return;
    }

    const lowerChar = char.toLowerCase();
    const isUppercase = char !== lowerChar && char === char.toUpperCase();
    const layout =
      SYMBOL_GLYPH_LAYOUT[char] ??
      (isUppercase
        ? UPPERCASE_GLYPH_LAYOUT[char]
        : LOWERCASE_GLYPH_LAYOUT[lowerChar]) ??
      FALLBACK_GLYPH_LAYOUT;

    const marginLeftValue =
      (layout.marginLeft ?? FALLBACK_GLYPH_LAYOUT.marginLeft ?? 0) * scale;
    const marginRightValue =
      (layout.marginRight ?? FALLBACK_GLYPH_LAYOUT.marginRight ?? 0) * scale +
      (index === characters.length - 1 ? 0 : letterSpacing);
    const baselineShiftValue = (layout.baselineShift ?? 0) * scale;

    const glyph = SIGNATURE_GLYPHS[char] ?? SIGNATURE_GLYPHS[lowerChar];

    if (!glyph) {
      glyphElements.push(
        <span
          key={`missing-${index}`}
          className="hws-missing"
          style={
            {
              '--hws-missing-w': missingGlyphWidthPx,
              '--hws-h': letterHeightPx,
              '--hws-ml': formatPx(marginLeftValue),
              '--hws-mr': formatPx(marginRightValue),
            } as CSSProperties
          }
        />,
      );
      cumulativeDelay +=
        durationPerLetterMs * (1 - clampedTimelineOverlap * 0.6);
      return;
    }

    const svgWidthValue =
      (glyph.viewBoxWidth / glyph.viewBoxHeight) * normalizedLetterHeight ||
      normalizedLetterHeight;
    const dashLengthValue = Math.max(
      normalizedLetterHeight * 0.85,
      (layout.dashLength ??
        FALLBACK_GLYPH_LAYOUT.dashLength ??
        normalizedLetterHeight * 2.2) * scale,
    );
    const dashLengthString = formatUnitless(dashLengthValue);
    const normalizedDash =
      dashLengthValue / Math.max(normalizedLetterHeight, 1);
    const letterDurationMsRaw =
      durationPerLetterMs *
      (DURATION_BASE_OFFSET + normalizedDash * DURATION_DASH_MULTIPLIER);
    const letterDurationMs = Math.max(
      durationPerLetterMs * MIN_DURATION_MULTIPLIER,
      letterDurationMsRaw,
    );
    const animationDelayMs = effectiveInitialDelayMs + cumulativeDelay;

    glyphElements.push(
      <svg
        key={`glyph-${index}-${char}`}
        viewBox={`0 0 ${glyph.viewBoxWidth} ${glyph.viewBoxHeight}`}
        className="hws-glyph"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={
          {
            '--hws-svg-w': formatPx(svgWidthValue),
            '--hws-h': letterHeightPx,
            '--hws-ml': formatPx(marginLeftValue),
            '--hws-mr': formatPx(marginRightValue),
            '--hws-bl': formatPx(baselineShiftValue),
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <path
          d={glyph.path}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="hws-path"
          style={
            {
              '--hws-dur': `${Math.round(letterDurationMs)}ms`,
              '--hws-delay': `${Math.round(animationDelayMs)}ms`,
              '--hws-dash-length': dashLengthString,
            } as CSSProperties
          }
        />
      </svg>,
    );

    cumulativeDelay +=
      letterDurationMs *
      (1 - clampedTimelineOverlap * TIMING_OVERLAP_MULTIPLIER);
  });

  return glyphElements;
};

const HandwrittenSignature = ({
  text = FALLBACK_TEXT,
  letterSpacing = 0,
  letterHeight = 68,
  durationPerLetterMs = 320,
  initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
  strokeWidth = 2,
  overlapRatio = 0.58,
  className,
  ...delegated
}: HandwrittenSignatureProps) => {
  const glyphElements = buildGlyphElements({
    text,
    letterSpacing,
    letterHeight,
    durationPerLetterMs,
    initialDelayMs,
    overlapRatio,
    strokeWidth,
  });

  return (
    <>
      <style
        id={STYLE_ID}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: CSS }}
        // React 19 dedupes <style> by precedence+href in <head> during SSR
        precedence="hws"
      />
      <div
        className={['hws-signature', className].filter(Boolean).join(' ')}
        {...delegated}
      >
        {glyphElements}
      </div>
    </>
  );
};

export default HandwrittenSignature;
