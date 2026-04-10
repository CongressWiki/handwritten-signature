import { useInsertionEffect, type CSSProperties, type ReactNode } from 'react';
import type { HandwrittenSignatureProps } from './types';
import { SIGNATURE_GLYPHS } from './glyphs';
import { acquireSignatureStyles, releaseSignatureStyles } from './styles';
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
  tempoVariation: number;
  pressureVariation: number;
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
  tempoVariation,
  pressureVariation,
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

  // Per-word glyph positions for tempo/pressure (each word gets its own curve)
  const words = normalizedText.split(' ');
  const wordGlyphCounts = words.map((w) => Array.from(w).length);
  // Map each character index to its [wordGlyphCount, indexWithinWord]
  let wordIdx = 0;
  let charInWord = 0;
  const glyphWordPosition: Array<{ count: number; index: number }> = [];
  for (const char of characters) {
    if (char === ' ') {
      glyphWordPosition.push({ count: 0, index: 0 }); // placeholder for space
      wordIdx++;
      charInWord = 0;
    } else {
      glyphWordPosition.push({ count: wordGlyphCounts[wordIdx], index: charInWord });
      charInWord++;
    }
  }
  const clampedTempo = Math.max(0, Math.min(tempoVariation, 1));
  const clampedPressure = Math.max(0, Math.min(pressureVariation, 1));

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
          style={{
            display: 'inline-block',
            width: spaceWidthPx,
            height: letterHeightPx,
            marginLeft: 0,
            marginRight: formatPx(spaceMarginRight),
          }}
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
          style={{
            display: 'inline-block',
            width: missingGlyphWidthPx,
            height: letterHeightPx,
            marginLeft: formatPx(marginLeftValue),
            marginRight: formatPx(marginRightValue),
          }}
        />,
      );
      cumulativeDelay +=
        durationPerLetterMs * (1 - clampedTimelineOverlap * 0.6);
      return;
    }

    // Position of this glyph within its word (0 to 1) for per-word rhythm
    const wp = glyphWordPosition[index];
    const glyphPosition = wp.count > 1 ? wp.index / (wp.count - 1) : 0.5;

    // Pressure: vary stroke width based on position. Peak slightly past center.
    // sin curve: thinner at start/end, thicker in the middle.
    const pressureCurve = Math.sin(Math.PI * (glyphPosition * 0.85 + 0.075));
    const pressuredStrokeWidth = Math.round(strokeWidth * (1 + clampedPressure * (pressureCurve - 0.5) * 0.5) * 100) / 100;

    // Tempo: velocity multiplier — higher = faster writing = shorter gaps
    // sin curve: slower at start/end, faster in the middle.
    const tempoMultiplier = 1 + clampedTempo * Math.sin(Math.PI * glyphPosition) * 1.2;

    const svgWidthValue =
      (glyph.viewBoxWidth / glyph.viewBoxHeight) * normalizedLetterHeight ||
      normalizedLetterHeight;

    // Determine stroke paths and their dash lengths
    const strokePaths = glyph.paths ?? (glyph.path ? [glyph.path] : []);
    const isMultiStroke = strokePaths.length > 1;

    // For multi-stroke, use per-stroke dash lengths; for single, use the layout value
    const fallbackDash =
      layout.dashLength ??
      FALLBACK_GLYPH_LAYOUT.dashLength ??
      normalizedLetterHeight * 2.2;

    const strokeDashLengths = isMultiStroke && layout.dashLengths
      ? layout.dashLengths.map((d) =>
          Math.max(normalizedLetterHeight * 0.85, d * scale),
        )
      : strokePaths.map(() =>
          Math.max(normalizedLetterHeight * 0.85, fallbackDash * scale),
        );

    // Build path elements with sequential delays for multi-stroke
    let strokeLocalDelay = 0;
    let totalLetterDurationMs = 0;
    const pathElements: ReactNode[] = [];

    strokePaths.forEach((strokePath, strokeIdx) => {
      const dashLengthValue = strokeDashLengths[strokeIdx] ?? strokeDashLengths[0];
      const dashLengthString = formatUnitless(dashLengthValue);
      const normalizedDash =
        dashLengthValue / Math.max(normalizedLetterHeight, 1);
      const strokeDurationMsRaw =
        durationPerLetterMs *
        (DURATION_BASE_OFFSET + normalizedDash * DURATION_DASH_MULTIPLIER);
      const strokeDurationMs = Math.max(
        durationPerLetterMs * MIN_DURATION_MULTIPLIER,
        strokeDurationMsRaw,
      );
      const animationDelayMs =
        effectiveInitialDelayMs + cumulativeDelay + strokeLocalDelay;

      pathElements.push(
        <path
          key={`stroke-${strokeIdx}`}
          d={strokePath}
          stroke="currentColor"
          strokeWidth={pressuredStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="hws-path"
          style={{
            strokeDasharray: dashLengthString,
            strokeDashoffset: 0,
            strokeOpacity: 1,
            animationName: 'hws-letter-stroke',
            animationDuration: `${Math.round(strokeDurationMs)}ms`,
            animationDelay: `${Math.round(animationDelayMs)}ms`,
            animationTimingFunction:
              'var(--hws-easing, cubic-bezier(0.33, 1, 0.68, 1))',
            animationDirection: 'reverse',
            animationFillMode: 'both',
            animationIterationCount: 1,
            animationPlayState:
              'var(--hws-play, running)' as CSSProperties['animationPlayState'],
            willChange: 'stroke-dashoffset, stroke-opacity',
            '--hws-dash-length': dashLengthString,
          } as CSSProperties}
        />,
      );

      // Next stroke starts after this one finishes (slight overlap for natural feel)
      const strokeEndMs = strokeLocalDelay + strokeDurationMs;
      strokeLocalDelay += strokeDurationMs * (isMultiStroke ? 0.85 : 1);
      totalLetterDurationMs = strokeEndMs;
    });

    // For single-stroke backward compat, use the original duration calculation
    if (!isMultiStroke) {
      const dashLengthValue = strokeDashLengths[0];
      const normalizedDash =
        dashLengthValue / Math.max(normalizedLetterHeight, 1);
      const letterDurationMsRaw =
        durationPerLetterMs *
        (DURATION_BASE_OFFSET + normalizedDash * DURATION_DASH_MULTIPLIER);
      totalLetterDurationMs = Math.max(
        durationPerLetterMs * MIN_DURATION_MULTIPLIER,
        letterDurationMsRaw,
      );
    }

    glyphElements.push(
      <svg
        key={`glyph-${index}-${char}`}
        viewBox={`0 0 ${glyph.viewBoxWidth} ${glyph.viewBoxHeight}`}
        className="hws-glyph"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'inline-block',
          overflow: 'visible',
          width: formatPx(svgWidthValue),
          height: letterHeightPx,
          marginLeft: formatPx(marginLeftValue),
          marginRight: formatPx(marginRightValue),
          transform: `translateY(${formatPx(baselineShiftValue)})`,
        }}
        aria-hidden="true"
      >
        {pathElements}
      </svg>,
    );

    // For multi-stroke letters, the next letter must wait for ALL strokes to
    // finish. Single-stroke letters use overlap for natural flow.
    // Tempo variation: divide gap by tempoMultiplier (faster = shorter gaps).
    if (isMultiStroke) {
      cumulativeDelay += totalLetterDurationMs / tempoMultiplier;
    } else {
      cumulativeDelay +=
        (totalLetterDurationMs *
        (1 - clampedTimelineOverlap * TIMING_OVERLAP_MULTIPLIER)) / tempoMultiplier;
    }
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
  easing,
  tempoVariation = 0,
  pressureVariation = 0,
  className,
  style,
  ...delegated
}: HandwrittenSignatureProps) => {
  useInsertionEffect(() => {
    acquireSignatureStyles();
    return () => {
      releaseSignatureStyles();
    };
  }, []);

  const glyphElements = buildGlyphElements({
    text,
    letterSpacing,
    letterHeight,
    durationPerLetterMs,
    initialDelayMs,
    overlapRatio,
    strokeWidth,
    tempoVariation,
    pressureVariation,
  });

  // Merge easing CSS variable into the style prop
  const mergedStyle = {
    display: 'flex',
    alignItems: 'flex-end',
    pointerEvents: 'auto',
    gap: 0,
    color: 'inherit',
    ...(style ?? {}),
    ...(easing ? { '--hws-easing': easing } : {}),
  } as CSSProperties;

  return (
    <div
      className={['hws-signature', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      {...delegated}
    >
      {glyphElements}
    </div>
  );
};

export default HandwrittenSignature;
