// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HandwrittenSignature from '../HandwrittenSignature';

describe('HandwrittenSignature server rendering', () => {
  it('renders stable server markup without embedding duplicate style tags', () => {
    const markup = renderToStaticMarkup(
      <HandwrittenSignature className="server-signature" text="A B" />,
    );

    expect(markup).toContain('class="hws-signature server-signature"');
    expect(markup).toContain('class="hws-space"');
    expect(markup).toContain('class="hws-glyph"');
    expect(markup).not.toContain('<style');
  });
});
