import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Stack } from '@mui/material';
import { prisma } from '@/lib';
import { VendorInfoCard, VendorProductPreview } from '@/components/sections/vendor';

type Props = {
  params: Promise<{ locale: string; vendorId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, vendorId } = await params;

  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: { company_name: true, description: true, city: true, is_active: true, is_published: true },
  });

  if (!vendor || !vendor.is_active || !vendor.is_published) {
    return { title: 'Vendor Not Found' };
  }

  const description =
    vendor.description ||
    (locale === 'ka'
      ? `${vendor.company_name}${vendor.city ? `, ${vendor.city}` : ''} — სტომატოლოგიური პროდუქტები DentalMall-ზე`
      : `${vendor.company_name}${vendor.city ? `, ${vendor.city}` : ''} — dental products on DentalMall`);

  return {
    title: vendor.company_name,
    description,
    openGraph: { title: vendor.company_name, description },
    alternates: {
      canonical: `/${locale}/vendors/${vendorId}`,
      languages: {
        en: `/en/vendors/${vendorId}`,
        ka: `/ka/vendors/${vendorId}`,
        'x-default': `/en/vendors/${vendorId}`,
      },
    },
  };
}

export default async function VendorDetailPage({ params }: Props) {
  const { vendorId } = await params;

  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: {
      company_name: true,
      logo: true,
      city: true,
      address: true,
      phone_number: true,
      email: true,
      description: true,
      created_at: true,
      is_active: true,
      is_published: true,
      _count: { select: { products: true } },
    },
  });

  // 404 for missing, inactive/suspended and still-buffered (unpublished) vendors.
  if (!vendor || !vendor.is_active || !vendor.is_published) {
    notFound();
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack spacing={{ xs: 3, md: 4 }}>
        {/* Full-width vendor identity + business info */}
        <VendorInfoCard
          vendor={{
            company_name: vendor.company_name,
            logo: vendor.logo,
            city: vendor.city,
            address: vendor.address,
            phone_number: vendor.phone_number,
            email: vendor.email,
            description: vendor.description,
            created_at: vendor.created_at.toISOString(),
            product_count: vendor._count.products,
          }}
        />

        {/* Product preview + "See all" (→ shop filtered by this vendor) */}
        <VendorProductPreview vendorId={vendorId} />
      </Stack>
    </Container>
  );
}
