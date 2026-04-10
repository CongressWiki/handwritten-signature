# Handwritten Signature - Package And Demo

## What This Is

`@congresswiki/handwritten-signature` is a reusable animated cursive SVG package for React.

It renders text as sequential SVG stroke paths with configurable spacing, overlap, timing, easing, and handwriting realism.

## Commands

```bash
yarn build
yarn dev
yarn lint
yarn test:run
yarn typecheck
```

Demo site:

```bash
cd site
yarn dev
yarn build
```

The demo imports directly from `../src/`, so source changes appear immediately there.

## Publishing

Publishing uses Changesets plus npm trusted publishing.

- add a changeset with `yarn changeset` for releasable package changes
- after `CI` passes on `main`, the publish workflow opens or updates a `Version packages` PR
- merging that PR lands the version bump and `CHANGELOG.md` update on `main`
- after `CI` passes on the merged release commit, the package is published to npm via OIDC and the matching `v*` tag is pushed
- the static demo site is deployed by the Pages workflow once GitHub Pages is available for the repository

The first public npm release was a one-time manual bootstrap because trusted publishing can only be attached to packages that already exist on npm.

## Architecture

Entry points:

| Entry point | Import path | Purpose |
| --- | --- | --- |
| Main | `@congresswiki/handwritten-signature` | main component and public types |
| Glyphs | `@congresswiki/handwritten-signature/glyphs` | SVG glyph definitions |
| Layout | `@congresswiki/handwritten-signature/layout` | spacing, dash-length, timing config |
| Types | `@congresswiki/handwritten-signature/types` | public TS types |

## How It Works

1. `HandwrittenSignature` splits the `text` prop into characters
2. glyph data comes from `SIGNATURE_GLYPHS`
3. layout data comes from `layout.ts`
4. stroke animation is driven by `stroke-dashoffset` and inline CSS custom properties
5. shared keyframe styles are installed once per document and removed after the last component unmounts

Multi-stroke letters use `paths[]` so strokes animate in order.

## Realism Props

- `tempoVariation`: varies inter-letter timing within each word
- `pressureVariation`: varies stroke width through the word
- `easing`: controls per-stroke draw timing

Round realism-related values carefully to avoid SSR hydration mismatches.

## Key Constants

- `CODEPEN_BASE_LETTER_HEIGHT = 51`
- `overlapRatio` controls timing overlap between adjacent single-stroke letters
- `FALLBACK_TEXT = 'Signature'`

## Adding A New Glyph

1. add the glyph path or paths to `src/glyphs.ts`
2. add matching layout config to `src/layout.ts`
3. measure dash lengths with `getTotalLength()` and pad them
4. build, typecheck, and verify in the demo

## Demo Site

The demo site contains:

- a playground
- transport controls
- easing-curve editing
- signature presets
- glyph test grids

The transport logic uses the Web Animations API rather than package-internal timing hacks.

## Important Rules

- Keep fallback rendering stable for empty or whitespace-only text
- Preserve stroke order for multi-stroke glyphs
- Update both glyph data and layout config together
- Keep the package free of unnecessary external CSS dependencies

## Consumer Setup

Consumers install the package directly from the public npm registry with no extra registry configuration.
