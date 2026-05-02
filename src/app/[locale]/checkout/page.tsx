import { Container } from '@mui/material';
import { CheckoutContent } from '@/components/sections/checkout';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('checkout');
  return {
    title: t('title'),
    robots: { index: false, follow: true },
  };
}

export default function CheckoutPage() {
  return (
    <Container maxWidth="lg">
      <CheckoutContent />
    </Container>
  );
}
