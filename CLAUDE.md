# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`@congresswiki/handwritten-signature` — a private npm package that renders text as animated cursive SVG stroke paths. Each letter draws on sequentially with configurable timing, spacing, overlap, and realistic handwriting effects (tempo variation, pressure simulation). Used across Congress.wiki sites.

## Commands

```bash
yarn build        # Build with tsup (ESM + .d.ts)
yarn dev          # Build in watch mode
yarn typecheck    # tsc --noEmit
```

No test suite. Validate changes by building and typechecking.

### Demo Site

```bash
cd site
yarn dev          # Start Next.js dev server at http://localhost:3099
yarn build        # Static export to site/out/ (for GitHub Pages)
```

The site imports directly from `../src/` via Turbopack — changes to the component source are reflected instantly.

## Publishing

Automatic on push to `main`. CI builds, typechecks, uses AI (Haiku via Vercel AI Gateway) to classify commits as patch/minor/major, publishes to GitHub Packages, and commits the version bump back with `[skip ci]` tag.

A second workflow (`pages.yml`) deploys `site/out/` to GitHub Pages on push to `main`.

## Architecture

### Component (`src/`)

Single React component (`HandwrittenSignature`) with four entry points:

| Entry Point | Import Path | Purpose |
|---|---|---|
| Main | `@congresswiki/handwritten-signature` | `HandwrittenSignature` component + type re-exports |
| Glyphs | `@congresswiki/handwritten-signature/glyphs` | `SIGNATURE_GLYPHS` — SVG path definitions (A-Z, a-z, symbols) |
| Layout | `@congresswiki/handwritten-signature/layout` | Per-character spacing, dash lengths, timing constants |
| Types | `@congresswiki/handwritten-signature/types` | `GlyphDefinition`, `GlyphLayoutConfig`, `HandwrittenSignatureProps` |

### How It Works

1. `HandwrittenSignature` takes a `text` prop, splits into characters, looks up each in `SIGNATURE_GLYPHS`
2. Each glyph has SVG `path`/`paths` data and `viewBox` dimensions. Multi-stroke glyphs (F, I, T, X, f, t, x) use `paths[]` for sequential stroke animation
3. Layout configs in `layout.ts` define per-character `marginLeft`, `marginRight`, `baselineShift`, and `dashLength`/`dashLengths` (measured via `getTotalLength()` + 30% padding)
4. Animation uses CSS `stroke-dashoffset` with per-path CSS custom properties (`--hws-dur`, `--hws-delay`, `--hws-dash-length`)
5. The `easing` prop sets `--hws-easing` CSS variable on the container (default: `cubic-bezier(0.33, 1, 0.68, 1)`)
6. Styles are injected inline via a `<style>` tag (no external CSS dependency)

### Realism Props

- **`tempoVariation`** (0–1): Modulates inter-letter delay with a per-word sin curve. Middle letters in each word draw faster, start/end letters slower. Multi-word text (e.g. "Ryan Parker") gets independent tempo cycles per word.
- **`pressureVariation`** (0–1): Varies `strokeWidth` per glyph — thicker in the middle of each word, thinner at edges. Uses the same per-word position calculation as tempo. Value is rounded to 2 decimals to avoid SSR hydration mismatches.
- **`easing`**: CSS timing function for each individual glyph's stroke draw-in animation. Does NOT control overall pacing across the signature — that's what `tempoVariation` does.

### Key Constants (layout.ts)

- `CODEPEN_BASE_LETTER_HEIGHT = 51` — all glyph viewBoxes and layout values are authored at this scale, then multiplied by `letterHeight / 51`
- `overlapRatio` (default 0.58) controls how much adjacent single-stroke letters overlap in time. Multi-stroke letters always wait for all strokes to finish before the next letter begins
- `FALLBACK_TEXT = 'Signature'` — rendered when `text` is empty/whitespace

### Adding a New Glyph

1. Add SVG path data to `SIGNATURE_GLYPHS` in `glyphs.ts` — use `path` for single-stroke or `paths` for multi-stroke
2. Add layout config to the appropriate map in `layout.ts` (`UPPERCASE_GLYPH_LAYOUT`, `LOWERCASE_GLYPH_LAYOUT`, or `SYMBOL_GLYPH_LAYOUT`)
3. Measure `dashLength` via `getTotalLength()` on each path and pad 30%

### Styles (`styles.ts`)

Contains the injected CSS: keyframe animation `hws-letter-stroke`, glyph/space/missing layout classes, and the `--hws-play` CSS variable that allows external control of animation play state (used by the demo site's `useAnimationControl` hook via the Web Animations API).

### Demo Site (`site/`)

Next.js 16 static site with a single page:

- **`page.tsx`**: Playground with text input, signature preview, transport bar (play/pause/seek/speed), collapsible controls panel (easing curve editor, style presets, sliders), draggable/reorderable examples, glyph test grids
- **`transport.tsx`**: Shared animation control hook (`useAnimationControl`) using the Web Animations API, transport bar component, easing curve editor (canvas-based cubic-bezier editor with draggable handles), signature style presets
- **`layout.tsx`**: Root layout with nav, logo, global styles

The easing curve editor draws on a `<canvas>` with two draggable control points (P1/P2). Endpoints are fixed at (0,0) and (1,1) per the CSS `cubic-bezier()` spec.

## Consumer Setup

Requires `.yarnrc.yml` configured for GitHub Packages:

```yaml
npmScopes:
  congresswiki:
    npmRegistryServer: "https://npm.pkg.github.com"
    npmAlwaysAuth: true
    npmAuthToken: "${GITHUB_TOKEN}"
```
