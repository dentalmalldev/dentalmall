import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@mui/material';
import { ProductRequestContent } from '@/components/sections/product-request';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'productRequest' });

  return {
    title: `${t('title')} | DentalMall`,
    robots: { index: false },
  };
}

export default function ProductRequestPage() {
  return (
    <Container maxWidth="lg">
      <ProductRequestContent />
    </Container>
  );
}
