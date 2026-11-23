/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.2'],
  transpilePackages: ['framer-motion', 'three'],
  // watchOptions : Next.js 16 n'accepte plus `ignored` dans ce bloc
  // (seul `pollIntervalMs` est reconnu). Le watcher Turbopack ignore déjà
  // .git automatiquement ; pour data/ on a basculé sur outputFileTracingIgnores.
  outputFileTracingIgnores: ['**/data/**'],
  turbopack: {
    resolveAlias: {
      react: './node_modules/react/index.js',
      'react-dom': './node_modules/react-dom/index.js',
      scheduler: './node_modules/scheduler/index.js',
    },
  },
  serverExternalPackages: ['ffmpeg-static', 'ffprobe-static'],
  experimental: {
    cpus: 4,
    serverActions: {
      bodySizeLimit: '4.5mb',
    },
    proxyClientMaxBodySize: '128mb',
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
