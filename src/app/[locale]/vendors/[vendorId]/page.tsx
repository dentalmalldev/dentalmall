import type { Metadata } from 'next';
import { Header } from '@/components/layout/header/header';
import { VendorProducts } from '@/components/sections/vendor-products';
import { prisma } from '@/lib';

type Props = {
  params: Promise<{ locale: string; vendorId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, vendorId } = await params;

  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: { company_name: true },
  });

  if (!vendor) {
    return { title: 'Vendor Not Found' };
  }

  return {
    title: vendor.company_name,
    description: locale === 'ka'
      ? `${vendor.company_name} - სტომატოლოგიური პროდუქტები DentalMall-ზე`
      : `${vendor.company_name} - dental products on DentalMall`,
    alternates: {
      canonical: `/${locale}/vendors/${vendorId}`,
      languages: {
        en: `/en/vendors/${vendorId}`,
        ka: `/ka/vendors/${vendorId}`,
      },
    },
  };
}

export default async function VendorProductsPage({ params }: Props) {
  const { vendorId } = await params;

  return (
    <>
      <Header />
      <VendorProducts vendorId={vendorId} />
    </>
  );
}
