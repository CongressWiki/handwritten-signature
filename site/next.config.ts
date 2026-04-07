import { resolve } from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.BASE_PATH || '',
  turbopack: {
    root: resolve(__dirname, '..'),
  },
};

export default nextConfig;
