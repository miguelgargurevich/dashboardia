// Proxy para desarrollo: redirige /api/* al backend Express
module.exports = {
  // Configuración para resolver problemas de CORS con HMR
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Headers para CORS
  async headers() {
    return [
      {
        source: '/(.*)',
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
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*'
      }
    ];
  },

  // Configuración específica para desarrollo
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Configurar webpack para HMR
      config.output.publicPath = `http://localhost:3000/_next/`;
    }
    return config;
  },

  // Configuración experimental para resolver problemas de HMR
  experimental: {
    esmExternals: false,
  }
};
