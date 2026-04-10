# @congresswiki/handwritten-signature

![Handwritten Signature Demo](./demo.gif)

Animated handwriting React component that renders text as cursive SVG stroke paths. Each letter draws on sequentially with configurable timing, spacing, and overlap.

## Install

Install the published package from npm:

```bash
npm install @congresswiki/handwritten-signature
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

## Publishing

Normal releases publish to npm after successful `CI` on `main` using npm trusted publishing (OIDC). The publish workflow waits for the `CI` workflow to pass, classifies the version bump (patch/minor/major), updates `CHANGELOG.md`, publishes to npm, and commits the release metadata back.

The first npm release is a one-time bootstrap step because npm trusted publishing can only be configured for packages that already exist on the npm registry. Recommended bootstrap sequence:

1. Make the GitHub repository public.
2. Log in with an npm account that can publish under the `@congresswiki` scope.
3. Run a one-time manual publish: `npm publish --access public`.
4. Configure the trusted publisher for `publish.yml` on npm, or run `npm trust github @congresswiki/handwritten-signature --repo CongressWiki/handwritten-signature --file publish.yml`.
5. After that, all future releases can publish from GitHub Actions via OIDC without npm tokens.

The demo site deployment workflow automatically skips while the repository is private on plans that do not support GitHub Pages for private repositories. Once the repository is public, the same workflow will deploy `site/out/` to GitHub Pages.
