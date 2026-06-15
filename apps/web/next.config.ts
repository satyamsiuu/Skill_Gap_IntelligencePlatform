/**
 * SGIP — Next.js Configuration
 * Ticket: SGIP-1.3.2.1 (standalone output for Docker)
 */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output — required for minimal Docker image (Dockerfile Stage 3).
  // Copies only the exact files needed to run the app into .next/standalone.
  // Without this, Docker images would need the full node_modules (~500MB+).
  output: 'standalone',

  // Enforce strict type checking during production builds
  typescript: {
    ignoreBuildErrors: false,
  },

  // Images from Cloudinary (Document 2 §9)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // API proxy — avoids CORS in production by routing through Next.js
  // In development, NEXT_PUBLIC_API_URL points directly to localhost:4000
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || process.env.NODE_ENV === 'development') {
      return [];
    }
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
