import { Header } from '@/components/layout/header/header';
import { VendorProducts } from '@/components/sections/vendor-products';

type Props = {
  params: Promise<{ locale: string; vendorId: string }>;
};

export default async function VendorProductsPage({ params }: Props) {
  const { vendorId } = await params;

  return (
    <>
      <Header />
      <VendorProducts vendorId={vendorId} />
    </>
  );
}
