/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion', 'three'],
  turbopack: {
    resolveAlias: {
      react: './node_modules/react/index.js',
      'react-dom': './node_modules/react-dom/index.js',
      scheduler: './node_modules/scheduler/index.js',
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4.5mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'pixiatech.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
// force reload 05/02/2026 14:01:19
