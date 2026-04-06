import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    glyphs: 'src/glyphs.ts',
    layout: 'src/layout.ts',
    types: 'src/types.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
