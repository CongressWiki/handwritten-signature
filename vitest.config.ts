import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/glyphs.ts', 'src/index.ts', 'src/layout.ts', 'src/types.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
