import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: { typedRoutes: false },
  images: { domains: [] },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
