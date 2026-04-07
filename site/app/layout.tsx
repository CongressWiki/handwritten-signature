import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Handwritten Signature',
  description: 'Animated cursive SVG signature component for React',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; }
          :root {
            --text-primary: #111;
            --text-secondary: #666;
            --text-tertiary: #999;
            --border: #e8e8e8;
            --border-subtle: #f0f0f0;
            --surface: #fff;
            --surface-raised: #fafafa;
            --surface-input: #fff;
            --accent: #111;
            --radius: 8px;
            --font: 'Inter', system-ui, -apple-system, sans-serif;
          }
          body {
            font-family: var(--font);
            background: var(--surface);
            color: var(--text-primary);
            -webkit-font-smoothing: antialiased;
            line-height: 1.5;
          }
          a { color: inherit; text-decoration: none; }
          .controls-panel summary::-webkit-details-marker { display: none; }
          .controls-panel[open] .controls-chevron { transform: rotate(90deg); }
        `}</style>
      </head>
      <body>
        <Nav />
        <main style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#111" />
      <g transform="translate(4, 3) scale(0.52)">
        <path
          d="M44.435 9.39728C49.435 -5.10286 -4.56457 25.3972 1.43476 32.8973C6.23411 38.8972 25.0605 38.3972 24.4355 40.8972C23.8105 43.3972 10.9355 44.8972 7.93479 42.8973"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function Nav() {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      padding: '0 24px',
      height: 56,
      maxWidth: 1080,
      margin: '0 auto',
      fontSize: 14,
    }}>
      <a href="/" style={{ fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
        <LogoMark />
        Handwritten Signature
      </a>
      <div style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
        <a href="https://github.com/CongressWiki/handwritten-signature" style={{ color: 'var(--text-secondary)' }}>GitHub</a>
      </div>
    </nav>
  );
}
