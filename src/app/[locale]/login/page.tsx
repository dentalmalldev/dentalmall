import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@mui/material';
import { LoginContent } from '@/components/sections/auth/login-content';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[]; tab?: string | string[] }>;
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
  const { next, tab } = await searchParams;
  // Only a path on this site: `next` comes from the URL, so anyone can craft it.
  const nextPath = typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : '/';
  // ?tab=register (registration QR codes) opens the Registration tab.
  const initialTab = tab === 'register' ? 'register' : 'authorization';

  return (
    <Container maxWidth="lg">
      <LoginContent nextPath={nextPath} initialTab={initialTab} />
    </Container>
  );
}
