import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HandwrittenSignature from '../HandwrittenSignature';
import { CODEPEN_BASE_LETTER_HEIGHT, FALLBACK_TEXT } from '../layout';
import { STYLE_ID } from '../styles';

const getPaths = (container: HTMLElement): SVGPathElement[] =>
  Array.from(container.querySelectorAll('path.hws-path'));

describe('HandwrittenSignature', () => {
  it('renders the fallback text when given blank content', () => {
    const { container } = render(<HandwrittenSignature text="   " />);

    expect(container.querySelectorAll('svg.hws-glyph')).toHaveLength(
      Array.from(FALLBACK_TEXT).length,
    );
    expect(container.querySelectorAll('.hws-space')).toHaveLength(0);
  });

  it('renders spaces and unsupported glyph placeholders without crashing', () => {
    const { container } = render(<HandwrittenSignature text="A 😀 B" />);

    expect(container.querySelectorAll('.hws-space')).toHaveLength(2);
    expect(container.querySelectorAll('.hws-missing')).toHaveLength(1);
    expect(container.querySelectorAll('svg.hws-glyph')).toHaveLength(2);
  });

  it('renders multistroke glyphs with sequential delays', () => {
    const { container } = render(
      <HandwrittenSignature
        text="F"
        durationPerLetterMs={200}
        initialDelayMs={120}
      />,
    );

    const paths = getPaths(container);

    expect(paths).toHaveLength(2);
    expect(paths[0]?.style.animationDelay).toBe('120ms');
    expect(Number.parseInt(paths[1]?.style.animationDelay ?? '0', 10)).toBeGreaterThan(
      120,
    );
  });

  it('applies delegated props and merges inline styling controls', () => {
    const { getByTestId } = render(
      <HandwrittenSignature
        className="custom-signature"
        data-testid="signature"
        easing="linear"
        style={{ color: 'rgb(255, 0, 0)' }}
        text="A"
        title="Example signature"
      />,
    );

    const signature = getByTestId('signature');

    expect(signature).toHaveClass('hws-signature');
    expect(signature).toHaveClass('custom-signature');
    expect(signature).toHaveAttribute('title', 'Example signature');
    expect(signature).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      display: 'flex',
    });
    expect(signature.style.getPropertyValue('--hws-easing')).toBe('linear');
  });

  it('normalizes invalid timing and size inputs to safe defaults', () => {
    const { container } = render(
      <HandwrittenSignature
        text="A"
        initialDelayMs={-100}
        letterHeight={-12}
      />,
    );

    const glyph = container.querySelector<SVGSVGElement>('svg.hws-glyph');
    const path = container.querySelector<SVGPathElement>('path.hws-path');

    expect(glyph?.style.height).toBe(`${CODEPEN_BASE_LETTER_HEIGHT}px`);
    expect(path?.style.animationDelay).toBe('0ms');
  });

  it('changes the animation profile when tempo and pressure variation are enabled', () => {
    const baseline = render(
      <HandwrittenSignature
        text="name"
        durationPerLetterMs={180}
        initialDelayMs={50}
        strokeWidth={2}
      />,
    );
    const baselinePaths = getPaths(baseline.container);
    const baselineDelays = baselinePaths.map((path) => path.style.animationDelay);
    const baselineStrokeWidths = baselinePaths.map((path) =>
      path.getAttribute('stroke-width'),
    );
    baseline.unmount();

    const varied = render(
      <HandwrittenSignature
        text="name"
        durationPerLetterMs={180}
        initialDelayMs={50}
        pressureVariation={1}
        strokeWidth={2}
        tempoVariation={1}
      />,
    );
    const variedPaths = getPaths(varied.container);
    const variedDelays = variedPaths.map((path) => path.style.animationDelay);
    const variedStrokeWidths = variedPaths.map((path) =>
      path.getAttribute('stroke-width'),
    );

    expect(variedDelays).not.toEqual(baselineDelays);
    expect(variedStrokeWidths).not.toEqual(baselineStrokeWidths);
  });

  it('injects a single shared keyframe stylesheet and removes it after the last unmount', () => {
    const first = render(<HandwrittenSignature text="A" />);
    const second = render(<HandwrittenSignature text="B" />);

    expect(document.head.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);

    first.unmount();
    expect(document.head.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1);

    second.unmount();
    expect(document.head.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(0);
  });
});
