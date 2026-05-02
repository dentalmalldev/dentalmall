import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@mui/material';
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
      languages: { en: '/en', ka: '/ka', 'x-default': '/en' },
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';

  return (
    <>
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
      {/*
        Business entity for Google's Knowledge Panel: the more fields populated,
        the richer the brand box (phone, hours, address, contact). Using `Store`
        — a Schema.org subtype that combines Organization + LocalBusiness — so
        Google treats it as a business with a physical address.
      */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Store',
          '@id': `${baseUrl}/#organization`,
          name: 'DentalMall',
          alternateName: 'DentalMall.ge',
          url: baseUrl,
          logo: `${baseUrl}/logos/logo-horizontal.png`,
          image: `${baseUrl}/og-image.png`,
          description:
            locale === 'ka'
              ? 'DentalMall.ge — ონლაინ პლატფორმა სტომატოლოგიური მასალებისა და აღჭურვილობისთვის. გვაკავშირებს კლინიკებსა და მომწოდებლებს.'
              : 'DentalMall.ge — online platform for dental materials and equipment. We connect clinics with trusted suppliers.',
          email: 'info@dentalmall.ge',
          telephone: '+995-597-427-742',
          priceRange: '₾₾',
          address: {
            '@type': 'PostalAddress',
            streetAddress:
              locale === 'ka'
                ? 'შოთა რუსთაველის ქუჩა N 19, ბინა 23'
                : 'Shota Rustaveli St 19, Apt 23',
            addressLocality: locale === 'ka' ? 'რუსთავი' : 'Rustavi',
            addressCountry: 'GE',
          },
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+995-597-427-742',
            email: 'info@dentalmall.ge',
            contactType: 'customer service',
            availableLanguage: ['Georgian', 'English'],
            areaServed: 'GE',
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
              ],
              opens: '08:00',
              closes: '18:00',
            },
          ],
          // Add real social profile URLs here once they exist — `sameAs` is what
          // links the Knowledge Panel to Facebook/Instagram/LinkedIn.
          // sameAs: ['https://facebook.com/dentalmall.ge', 'https://instagram.com/dentalmall.ge'],
        }}
      />
      <Container maxWidth="lg">
        <Hero />
        <Categories />
        <Products />
        <PartnerStores />
      </Container>
      <BecomeUser />
      <Container maxWidth="lg">
        <FAQ />
      </Container>
    </>
  );
}
