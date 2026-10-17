# Handwritten Signature - Package And Demo

## What This Is

`@congresswiki/handwritten-signature` is a reusable animated cursive SVG package for React.

It renders text as sequential SVG stroke paths with configurable spacing, overlap, timing, easing, and handwriting realism.

## Commands

```bash
yarn build        # tsup (ESM + .d.ts)
yarn dev          # tsup in watch mode
yarn lint         # ESLint across package source, tests, and scripts
yarn test:run     # Vitest with coverage
yarn typecheck    # tsc --noEmit
```

Demo site:

```bash
cd site
yarn dev          # next dev --turbopack on port 3099
yarn typecheck    # next typegen && tsc --noEmit
yarn build        # static export to site/out/ (GitHub Pages)
```

From the root, `yarn site:build` and `yarn site:typecheck` run the same site scripts.

The demo imports directly from `../src/`, so source changes appear immediately there.

## Publishing

Publishing uses the repo's AI-driven auto-release workflow plus npm trusted publishing.

- after `CI` passes on `main`, the publish workflow compares commits since the latest `v*` tag
- the workflow asks the AI classifier for the correct semver bump (`patch`, `minor`, or `major`)
- if a release is needed, the workflow updates `package.json` and `CHANGELOG.md`, publishes to npm via OIDC, and pushes the matching release commit and `v*` tag back to `main`
- branch-protected release pushes use `RELEASE_PUSH_TOKEN`
- the AI classifier falls back to `patch` when its key is unavailable
- the static demo site (`site/out/`) is deployed by `pages.yml` on push to `main`; while the repository is private that workflow skips deployment cleanly

The first public npm release was a one-time manual bootstrap because trusted publishing can only be attached to packages that already exist on npm.

## Architecture

Entry points:

| Entry point | Import path | Purpose |
| --- | --- | --- |
| Main | `@congresswiki/handwritten-signature` | main component and public types |
| Glyphs | `@congresswiki/handwritten-signature/glyphs` | `SIGNATURE_GLYPHS` SVG path definitions (A-Z, a-z, symbols) |
| Layout | `@congresswiki/handwritten-signature/layout` | per-character spacing, dash lengths, timing constants |
| Types | `@congresswiki/handwritten-signature/types` | `GlyphDefinition`, `GlyphLayoutConfig`, `HandwrittenSignatureProps` |

## How It Works

1. `HandwrittenSignature` splits the `text` prop into characters and looks each up in `SIGNATURE_GLYPHS`
2. each glyph has `path` or `paths` data plus `viewBox` dimensions; multi-stroke glyphs (F, I, T, X, f, t, x) use `paths[]` so strokes animate in order
3. `src/layout.ts` defines per-character `marginLeft`, `marginRight`, and `dashLength`/`dashLengths` (`GlyphLayoutConfig` also accepts `baselineShift`) in three maps: `UPPERCASE_GLYPH_LAYOUT`, `LOWERCASE_GLYPH_LAYOUT`, `SYMBOL_GLYPH_LAYOUT` (plus `FALLBACK_GLYPH_LAYOUT`)
4. stroke animation is driven by `stroke-dashoffset` and per-path CSS custom properties (`--hws-dash-length`, `--hws-easing`, `--hws-play`)
5. the shared `hws-letter-stroke` keyframes in `src/styles.ts` are emitted inline by the component so the consumer API stays zero-config and SSR-safe

## Realism Props

- `tempoVariation` (0-1): per-word sine curve on inter-letter delay; middle letters draw faster, edge letters slower
- `pressureVariation` (0-1): varies `strokeWidth` per glyph, thicker mid-word, rounded to 2 decimals
- `easing`: CSS timing function for each glyph's draw-in (sets `--hws-easing`, default `cubic-bezier(0.33, 1, 0.68, 1)`); overall pacing comes from `tempoVariation`

Round realism-related values carefully to avoid SSR hydration mismatches.

## Key Constants

- `CODEPEN_BASE_LETTER_HEIGHT = 51`: glyph viewBoxes and layout values are authored at this scale, then multiplied by `letterHeight / 51`
- `overlapRatio` (default 0.58) controls timing overlap between adjacent single-stroke letters; multi-stroke letters finish all strokes before the next letter starts
- `FALLBACK_TEXT = 'Signature'`

## Adding A New Glyph

1. add the glyph `path` (single stroke) or `paths` (multi-stroke) to `SIGNATURE_GLYPHS` in `src/glyphs.ts`
2. add matching layout config to the right map in `src/layout.ts`
3. measure each path with `getTotalLength()` and pad the dash length by 30%
4. build, typecheck, and verify in the demo

## Demo Site

The demo site contains:

- a playground
- transport controls
- easing-curve editing
- signature presets
- glyph test grids

`site/app/page.tsx` is the playground. `site/app/transport.tsx` holds the `useAnimationControl` hook, the transport bar and the canvas cubic-bezier editor (P1/P2 draggable, endpoints fixed at (0,0) and (1,1)). The transport logic uses the Web Animations API rather than package-internal timing hacks.

## Important Rules

- Keep fallback rendering stable for empty or whitespace-only text
- Preserve stroke order for multi-stroke glyphs
- Update both glyph data and layout config together
- Keep the package free of unnecessary external CSS dependencies

## Consumer Setup

Consumers install the package directly from the public npm registry with no extra registry configuration.
