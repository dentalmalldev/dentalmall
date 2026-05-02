import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Georgian } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@/theme";
import { Box } from "@mui/material";
import { BottomNavigation, Footer } from "@/components/layout";
import { Header } from "@/components/layout/header/header";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { LocaleProvider } from './locale-provider';
import { QueryProvider, AuthProvider, CartProvider, SnackbarProvider, AuthModalProvider } from '@/providers';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-sans-georgian",
  subsets: ["georgian", "latin"],
  display: 'swap',
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const meta = messages.metadata as { title: string; description: string };
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';
  const ogImage = `${baseUrl}/og-image.png`;

  return {
    title: { default: meta.title, template: `%s | DentalMall` },
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      siteName: 'DentalMall',
      locale: locale === 'ka' ? 'ka_GE' : 'en_US',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'DentalMall' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImage],
    },
    alternates: {
      canonical: `/${locale}`,
      languages: { en: '/en', ka: '/ka', 'x-default': '/en' },
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const htmlLang = locale === 'ka' ? 'ka' : 'en';

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansGeorgian.variable}`}>
        <LocaleProvider locale={locale}>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <CartProvider>
                <QueryProvider>
                  <AppRouterCacheProvider>
                    <ThemeProvider>
                      <SnackbarProvider>
                        <AuthModalProvider>
                          <Header />
                          <Box
                            component="main"
                            sx={{
                              // Compensate for the fixed header so content doesn't slide under it.
                              // Header self-hides on dashboard routes — those layouts manage their own spacing.
                              pt: { xs: '180px', md: '140px' },
                            }}
                          >
                            {children}
                          </Box>
                          <Footer />
                          <BottomNavigation />
                        </AuthModalProvider>
                      </SnackbarProvider>
                    </ThemeProvider>
                  </AppRouterCacheProvider>
                </QueryProvider>
              </CartProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
