import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Locale-aware patterns: real URLs are /{locale}/admin, /{locale}/profile, etc.
      // Plain `/admin/` would NOT match `/en/admin/...` — we need the locale segment glob.
      disallow: [
        '/api/',
        '/*/admin/',
        '/*/admin',
        '/*/profile/',
        '/*/profile',
        '/*/cart/',
        '/*/cart',
        '/*/checkout/',
        '/*/checkout',
        '/*/vendor-dashboard/',
        '/*/vendor-dashboard',
        '/*/storage/',
        '/*/storage',
        '/*/accountant/',
        '/*/accountant',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
