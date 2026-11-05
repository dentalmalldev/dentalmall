import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@mui/material';
import { LoginContent } from '@/components/sections/auth/login-content';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: `${t('title')} | DentalMall`,
    robots: { index: false },
  };
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  // Only a path on this site: `next` comes from the URL, so anyone can craft it.
  const nextPath = typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : '/';

  return (
    <Container maxWidth="lg">
      <LoginContent nextPath={nextPath} />
    </Container>
  );
}
