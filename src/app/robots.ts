import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixiatech.com';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/mon-compte',
        '/api/',
        '/quote/',
        '/embed',
        '/chat-widget',
        '/test-admin',
        '/test-db',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}