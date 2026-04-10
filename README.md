# @congresswiki/handwritten-signature

![Handwritten Signature Demo](./demo.gif)

Animated handwriting React component that renders text as cursive SVG stroke paths. Each letter draws on sequentially with configurable timing, spacing, and overlap.

## Install

Install from npm:

```bash
npm install @congresswiki/handwritten-signature
```

Demo: [congresswiki.github.io/handwritten-signature](https://congresswiki.github.io/handwritten-signature/)

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

The component includes its own keyframes. It inherits `color` from its parent for stroke color. Animation is CSS-based using `stroke-dashoffset`. Pause animation with:

```css
.hws-signature {
  --hws-play: paused;
}
```

## Development

```bash
yarn install
yarn lint
yarn typecheck
yarn test:run
yarn build
yarn site:typecheck
yarn site:build
```

## Community

- [Contributing](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
