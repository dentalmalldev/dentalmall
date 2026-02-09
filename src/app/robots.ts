import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/profile/',
        '/checkout/',
        '/cart/',
        '/vendor-dashboard/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
