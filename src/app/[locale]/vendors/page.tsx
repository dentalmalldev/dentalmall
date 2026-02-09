import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/header/header';
import { VendorsListing } from '@/components/sections/vendors-listing';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('vendorsTitle'),
    description: t('vendorsDescription'),
    openGraph: {
      title: t('vendorsTitle'),
      description: t('vendorsDescription'),
    },
    alternates: {
      canonical: `/${locale}/vendors`,
      languages: { en: '/en/vendors', ka: '/ka/vendors' },
    },
  };
}

export default function VendorsPage() {
  return (
    <>
      <Header />
      <VendorsListing />
    </>
  );
}
