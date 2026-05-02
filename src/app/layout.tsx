import type { Metadata, Viewport } from "next";
import "./globals.css";

// Root layout is intentionally minimal — `[locale]/layout.tsx` owns <html>/<body>
// so it can set `lang={locale}` for SEO + a11y. Next.js requires a root layout but
// allows nested layouts to render the html/body tags.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge'),
  title: "DentalMall",
  description: "Dental products online store",
};

export const viewport: Viewport = {
  themeColor: '#5B6ECD',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
