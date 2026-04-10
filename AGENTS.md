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

Publishing is automatic after successful `CI` on `main`.

- CI builds and type checks
- AI classifies the version bump
- `CHANGELOG.md` is updated during releases
- the package is published to GitHub Packages
- the static demo site is deployed by the Pages workflow once GitHub Pages is available for the repository

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

Consumers need GitHub Packages auth in `.yarnrc.yml`:

```yaml
npmScopes:
  congresswiki:
    npmRegistryServer: "https://npm.pkg.github.com"
    npmAlwaysAuth: true
    npmAuthToken: "${GITHUB_TOKEN}"
```
