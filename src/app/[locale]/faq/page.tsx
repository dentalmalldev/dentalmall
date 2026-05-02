import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@mui/material';
import { FAQContent } from '@/components/sections/faq/faq-content';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('faqTitle'),
    description: t('faqDescription'),
    openGraph: {
      title: t('faqTitle'),
      description: t('faqDescription'),
    },
    alternates: {
      canonical: `/${locale}/faq`,
      languages: { en: '/en/faq', ka: '/ka/faq', 'x-default': '/en/faq' },
    },
  };
}

export default function FAQPage() {
  return (
    <Container maxWidth="lg">
      <FAQContent />
    </Container>
  );
}
