// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HandwrittenSignature from '../HandwrittenSignature';

describe('HandwrittenSignature server rendering', () => {
  it('renders stable server markup with inline keyframes and glyph output', () => {
    const markup = renderToStaticMarkup(
      <HandwrittenSignature
        className="server-signature"
        letterHeight={48}
        text="A B"
      />,
    );

    expect(markup).toContain('class="hws-signature server-signature"');
    expect(markup).toContain('data-hws-styles');
    expect(markup).toContain('@keyframes hws-letter-stroke');
    expect(markup).toContain('display:flex');
    expect(markup).toContain('align-items:flex-end');
    expect(markup).toContain('class="hws-space"');
    expect(markup).toContain('class="hws-glyph"');
    expect(markup).toContain('height:48.00px');
  });
});
