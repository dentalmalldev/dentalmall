import { MetadataRoute } from 'next';
import { prisma } from '@/lib';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';
  const locales = ['en', 'ka'];

  // Static pages for both locales
  const staticPages = ['', '/categories', '/vendors'].flatMap((path) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1.0 : 0.8,
    }))
  );

  // Dynamic product pages
  const products = await prisma.products.findMany({
    select: { id: true, updated_at: true },
  });
  const productPages = products.flatMap((p) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/products/${p.id}`,
      lastModified: p.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // Parent categories (no parent_id)
  const parentCategories = await prisma.categories.findMany({
    where: { parent_id: null },
    select: { id: true, updated_at: true },
  });
  const categoryPages = parentCategories.flatMap((c) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/categories/${c.id}`,
      lastModified: c.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  // Subcategories (have parent_id)
  const subcategories = await prisma.categories.findMany({
    where: { parent_id: { not: null } },
    select: { id: true, parent_id: true, updated_at: true },
  });
  const subcategoryPages = subcategories.flatMap((s) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/categories/${s.parent_id}/${s.id}`,
      lastModified: s.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // Vendor pages
  const vendors = await prisma.vendors.findMany({
    where: { is_active: true },
    select: { id: true, updated_at: true },
  });
  const vendorPages = vendors.flatMap((v) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/vendors/${v.id}`,
      lastModified: v.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  );

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...subcategoryPages,
    ...vendorPages,
  ];
}
