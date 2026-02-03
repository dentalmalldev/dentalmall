import { Header } from '@/components';
import { CheckoutContent } from '@/components/sections/checkout';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('checkout');
  return {
    title: `${t('title')} | DentalMall`,
  };
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CheckoutContent />
    </>
  );
}
