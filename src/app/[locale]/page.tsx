import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from "@/components/layout/header/header";
import {
  Hero,
  Categories,
  Products,
  FAQ,
  PartnerStores,
  BecomeUser,
} from "@/components/sections";
import { JsonLd } from '@/components/common';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    openGraph: {
      title: t('homeTitle'),
      description: t('homeDescription'),
      type: 'website',
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', ka: '/ka' },
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';

  return (
    <>
      <Header />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'DentalMall',
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/${locale}/categories?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'DentalMall',
          url: baseUrl,
          logo: `${baseUrl}/logo.png`,
        }}
      />
      <Hero />
      <Categories />
      <Products />
      <PartnerStores />
      <BecomeUser />
      <FAQ />
    </>
  );
}
