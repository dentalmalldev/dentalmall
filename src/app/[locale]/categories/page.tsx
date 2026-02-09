import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from "@/components/layout/header/header";
import { AllCategories } from "@/components/sections/all-categories";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('categoriesTitle'),
    description: t('categoriesDescription'),
    openGraph: {
      title: t('categoriesTitle'),
      description: t('categoriesDescription'),
    },
    alternates: {
      canonical: `/${locale}/categories`,
      languages: { en: '/en/categories', ka: '/ka/categories' },
    },
  };
}

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <AllCategories />
    </>
  );
}
