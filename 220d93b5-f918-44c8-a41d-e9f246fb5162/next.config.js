/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Headers configuration for iframe embedding and cross-origin cookie support
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Allow embedding in iframes from any origin
          // Remove X-Frame-Options to allow iframe embedding
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          // Content Security Policy to allow framing
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
          // Allow credentials in cross-origin requests
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Permissions policy for storage access in iframes
          {
            key: 'Permissions-Policy',
            value: 'storage-access=*',
          },
        ],
      },
      {
        // API routes need CORS headers
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

