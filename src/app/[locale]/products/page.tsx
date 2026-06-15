import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container } from '@mui/material';
import { getTranslations } from 'next-intl/server';
import { ShopContent } from '@/components/sections/shop';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'shop' });

  return {
    title: t('allProducts'),
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${locale}/products`,
      languages: { en: '/en/products', ka: '/ka/products', 'x-default': '/en/products' },
    },
  };
}

export default function ProductsShopPage() {
  return (
    <Container maxWidth="lg">
      <Suspense fallback={null}>
        <ShopContent />
      </Suspense>
    </Container>
  );
}
