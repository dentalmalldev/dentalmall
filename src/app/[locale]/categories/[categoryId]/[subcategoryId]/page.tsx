import type { Metadata } from 'next';
import { Header } from "@/components/layout/header/header";
import { SubcategoryDetail } from "@/components/sections/subcategory-detail";
import { JsonLd } from '@/components/common';
import { prisma } from '@/lib';

type Props = {
  params: Promise<{ locale: string; categoryId: string; subcategoryId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, categoryId, subcategoryId } = await params;

  const [parent, subcategory] = await Promise.all([
    prisma.categories.findUnique({
      where: { id: categoryId },
      select: { name: true, name_ka: true },
    }),
    prisma.categories.findUnique({
      where: { id: subcategoryId },
      select: { name: true, name_ka: true },
    }),
  ]);

  if (!subcategory) {
    return { title: 'Subcategory Not Found' };
  }

  const name = locale === 'ka' ? subcategory.name_ka : subcategory.name;
  const parentName = parent ? (locale === 'ka' ? parent.name_ka : parent.name) : '';

  return {
    title: name,
    description: locale === 'ka'
      ? `${name} - ${parentName} - სტომატოლოგიური პროდუქტები DentalMall-ზე`
      : `${name} - ${parentName} - dental products on DentalMall`,
    alternates: {
      canonical: `/${locale}/categories/${categoryId}/${subcategoryId}`,
      languages: {
        en: `/en/categories/${categoryId}/${subcategoryId}`,
        ka: `/ka/categories/${categoryId}/${subcategoryId}`,
      },
    },
  };
}

export default async function SubcategoryPage({ params }: Props) {
  const { locale, categoryId, subcategoryId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';

  const [parent, subcategory] = await Promise.all([
    prisma.categories.findUnique({
      where: { id: categoryId },
      select: { name: true, name_ka: true },
    }),
    prisma.categories.findUnique({
      where: { id: subcategoryId },
      select: { name: true, name_ka: true },
    }),
  ]);

  const parentName = parent ? (locale === 'ka' ? parent.name_ka : parent.name) : '';
  const subName = subcategory ? (locale === 'ka' ? subcategory.name_ka : subcategory.name) : '';

  return (
    <>
      <Header />
      {subcategory && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'DentalMall',
                item: `${baseUrl}/${locale}`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: locale === 'ka' ? 'კატეგორიები' : 'Categories',
                item: `${baseUrl}/${locale}/categories`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: parentName,
                item: `${baseUrl}/${locale}/categories/${categoryId}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: subName,
                item: `${baseUrl}/${locale}/categories/${categoryId}/${subcategoryId}`,
              },
            ],
          }}
        />
      )}
      <SubcategoryDetail categoryId={categoryId} subcategoryId={subcategoryId} />
    </>
  );
}
