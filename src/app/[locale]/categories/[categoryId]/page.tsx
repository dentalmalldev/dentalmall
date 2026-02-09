import type { Metadata } from 'next';
import { Header } from "@/components/layout/header/header";
import { CategoryDetail } from "@/components/sections/category-detail";
import { JsonLd } from '@/components/common';
import { prisma } from '@/lib';

type Props = {
  params: Promise<{ locale: string; categoryId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, categoryId } = await params;

  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
    select: { name: true, name_ka: true, image: true },
  });

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const name = locale === 'ka' ? category.name_ka : category.name;

  return {
    title: name,
    description: locale === 'ka'
      ? `${name} - სტომატოლოგიური პროდუქტები DentalMall-ზე`
      : `${name} - dental products on DentalMall`,
    openGraph: {
      title: name,
      images: category.image ? [category.image] : undefined,
    },
    alternates: {
      canonical: `/${locale}/categories/${categoryId}`,
      languages: {
        en: `/en/categories/${categoryId}`,
        ka: `/ka/categories/${categoryId}`,
      },
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, categoryId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';

  const category = await prisma.categories.findUnique({
    where: { id: categoryId },
    select: { name: true, name_ka: true },
  });

  const categoryName = category
    ? (locale === 'ka' ? category.name_ka : category.name)
    : '';

  return (
    <>
      <Header />
      {category && (
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
                name: categoryName,
                item: `${baseUrl}/${locale}/categories/${categoryId}`,
              },
            ],
          }}
        />
      )}
      <CategoryDetail categoryId={categoryId} />
    </>
  );
}
