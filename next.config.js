/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dtlvqpmyukwcbpllgpue.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/dashboardia-bucket/resources/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://dashboardia.onrender.com/api/:path*'
          : 'http://localhost:4000/api/:path*',
      },
    ]
  },
};

module.exports = nextConfig;
