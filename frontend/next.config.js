// frontend/next.config.js
/** @type {import('next').NextConfig} */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  // `next dev` and `next build` both write to .next by default, so running a
  // build while the dev server is up wipes the assets it is serving and every
  // page renders unstyled until dev is restarted. Set NEXT_DIST_DIR to give a
  // verification build its own directory (see the `build:check` script).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Tarayıcı yalnız frontend origin'ine konuşur; /api istekleri sunucu tarafında
  // backend'e proxy'lenir (tek origin → tunnel/CORS sorunsuz, cookie aynı origin).
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND}/api/:path*` }];
  },
};

module.exports = nextConfig;
