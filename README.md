# @congresswiki/handwritten-signature

Animated handwriting React component that renders text as cursive SVG stroke paths. Each letter draws on sequentially with configurable timing, spacing, and overlap.

## Install

```bash
yarn add @congresswiki/handwritten-signature
```

Requires `.yarnrc.yml` configured for GitHub Packages:

```yaml
npmScopes:
  congresswiki:
    npmRegistryServer: "https://npm.pkg.github.com"
    npmAlwaysAuth: true
    npmAuthToken: "${GITHUB_TOKEN}"
```

## Usage

```tsx
import { HandwrittenSignature } from '@congresswiki/handwritten-signature';

<HandwrittenSignature text="John Hancock" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `"Signature"` | Text to render |
| `letterHeight` | `number` | `68` | Height of each letter in pixels |
| `letterSpacing` | `number` | `0` | Extra spacing between letters in pixels |
| `durationPerLetterMs` | `number` | `320` | Base animation duration per letter |
| `initialDelayMs` | `number` | `300` | Delay before animation starts |
| `strokeWidth` | `number` | `2` | SVG stroke width |
| `overlapRatio` | `number` | `0.58` | How much adjacent letter animations overlap (0-0.9) |
| `className` | `string` | — | Additional CSS class on the container |

All standard `div` HTML attributes are also supported.

## Entry Points

| Import | Contents |
|--------|----------|
| `@congresswiki/handwritten-signature` | `HandwrittenSignature` component + types |
| `@congresswiki/handwritten-signature/glyphs` | SVG path definitions for all glyphs |
| `@congresswiki/handwritten-signature/layout` | Per-character spacing, dash lengths, timing constants |
| `@congresswiki/handwritten-signature/types` | `GlyphDefinition`, `GlyphLayoutConfig`, `HandwrittenSignatureProps` |

## Supported Characters

Full uppercase (A-Z), lowercase (a-z), and symbols: `.` `-` `'`

Multi-stroke letters (F, I, T, X, f, t, x) animate each stroke sequentially.

## Styling

The component inherits `color` from its parent for stroke color. Animation is CSS-based using `stroke-dashoffset`. Pause animation with:

```css
.hws-signature {
  --hws-play: paused;
}
```

## Publishing

Automatic on push to `main`. CI builds, typechecks, uses AI to classify the version bump (patch/minor/major), publishes to GitHub Packages, and commits the version bump back.
