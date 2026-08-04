import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Tell Turbopack that the frontend directory is its own root,
    // so it doesn't get confused by the backend package-lock.json one level up.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
