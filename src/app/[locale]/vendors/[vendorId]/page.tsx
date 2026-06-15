import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Box, Container } from '@mui/material';
import { prisma } from '@/lib';
import { VendorInfoCard, VendorProductPreview } from '@/components/sections/vendor';

type Props = {
  params: Promise<{ locale: string; vendorId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, vendorId } = await params;

  const vendor = await prisma.vendors.findUnique({
    where: { id: vendorId },
    select: { company_name: true, description: true, city: true, is_active: true },
  });

  if (!vendor || !vendor.is_active) {
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
      _count: { select: { products: true } },
    },
  });

  // 404 for missing or inactive/suspended vendors.
  if (!vendor || !vendor.is_active) {
    notFound();
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 3, md: 4 },
          alignItems: 'flex-start',
        }}
      >
        {/* Vendor identity + business info */}
        <Box sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
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
        </Box>

        {/* Products preview + "See all" */}
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <VendorProductPreview vendorId={vendorId} />
        </Box>
      </Box>
    </Container>
  );
}
