import { ImageResponse } from 'next/og';
import { SIGNATURE_GLYPHS } from '../../src/glyphs';
import {
  CODEPEN_BASE_LETTER_HEIGHT,
  UPPERCASE_GLYPH_LAYOUT,
  LOWERCASE_GLYPH_LAYOUT,
  FALLBACK_GLYPH_LAYOUT,
} from '../../src/layout';

export const dynamic = 'force-static';
export const alt = 'Handwritten Signature — Animated SVG Signatures for React';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SIGNATURE_TEXT = 'Signature';
const LETTER_HEIGHT = 100;
const STROKE_WIDTH = 2.5;
const STROKE_COLOR = '#fff';

function buildSignatureGlyphs() {
  const scale = LETTER_HEIGHT / CODEPEN_BASE_LETTER_HEIGHT;
  const chars = Array.from(SIGNATURE_TEXT);

  return chars.map((char, i) => {
    const lowerChar = char.toLowerCase();
    const isUpper = char !== lowerChar && char === char.toUpperCase();
    const glyph = SIGNATURE_GLYPHS[char] ?? SIGNATURE_GLYPHS[lowerChar];
    const layout = (
      isUpper
        ? UPPERCASE_GLYPH_LAYOUT[char]
        : LOWERCASE_GLYPH_LAYOUT[lowerChar]
    ) ?? FALLBACK_GLYPH_LAYOUT;

    if (!glyph) return null;

    const svgWidth =
      (glyph.viewBoxWidth / glyph.viewBoxHeight) * LETTER_HEIGHT;
    const ml = (layout.marginLeft ?? -4) * scale;
    const mr = (layout.marginRight ?? -6) * scale;
    const bl = (layout.baselineShift ?? 0) * scale;
    const paths = glyph.paths ?? (glyph.path ? [glyph.path] : []);

    return (
      <svg
        key={i}
        width={svgWidth}
        height={LETTER_HEIGHT}
        viewBox={`0 0 ${glyph.viewBoxWidth} ${glyph.viewBoxHeight}`}
        style={{
          marginLeft: ml,
          marginRight: mr,
          ...(bl ? { transform: `translateY(${bl}px)` } : {}),
          overflow: 'visible' as const,
        }}
      >
        {paths.map((d, j) => (
          <path
            key={j}
            d={d}
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </svg>
    );
  });
}

export default function OgImage() {
  const glyphs = buildSignatureGlyphs();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#111',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Rendered signature using actual glyph paths */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            marginBottom: 48,
          }}
        >
          {glyphs}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          Handwritten Signature
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: '#999',
            lineHeight: 1.4,
          }}
        >
          Animated cursive SVG signatures for React
        </div>

        {/* Attribution */}
        <div
          style={{
            fontSize: 16,
            color: '#555',
            marginTop: 36,
          }}
        >
          @congresswiki/handwritten-signature
        </div>
      </div>
    ),
    { ...size },
  );
}
