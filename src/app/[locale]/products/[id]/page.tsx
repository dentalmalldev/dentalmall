import type { Metadata } from 'next';
import { Header } from "@/components";
import { ProductDetail } from "@/components/sections/product-detail";
import { JsonLd } from '@/components/common';
import { prisma } from "@/lib";

type Params = Promise<{ id: string; locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id, locale } = await params;

  const product = await prisma.products.findUnique({
    where: { id },
    select: {
      name: true,
      name_ka: true,
      description: true,
      description_ka: true,
      media: { select: { url: true }, take: 4 },
    },
  });

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const name = locale === 'ka' ? product.name_ka : product.name;
  const description = locale === 'ka' ? product.description_ka : product.description;
  const images = product.media.map((m) => m.url);

  return {
    title: name,
    description: description || (locale === 'ka' ? `შეიძინეთ ${name} DentalMall-ზე` : `Buy ${name} from DentalMall`),
    openGraph: {
      title: name,
      description: description || undefined,
      images: images.length > 0 ? images : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: description || undefined,
      images: images.length > 0 ? images[0] : undefined,
    },
    alternates: {
      canonical: `/${locale}/products/${id}`,
      languages: {
        en: `/en/products/${id}`,
        ka: `/ka/products/${id}`,
      },
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id, locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge';

  const product = await prisma.products.findUnique({
    where: { id },
    select: {
      name: true,
      name_ka: true,
      description: true,
      description_ka: true,
      price: true,
      sale_price: true,
      stock: true,
      manufacturer: true,
      media: { select: { url: true }, take: 1 },
      category: { select: { id: true, name: true, name_ka: true } },
    },
  });

  const name = product ? (locale === 'ka' ? product.name_ka : product.name) : '';
  const description = product ? (locale === 'ka' ? product.description_ka : product.description) : '';
  const categoryName = product?.category ? (locale === 'ka' ? product.category.name_ka : product.category.name) : '';

  return (
    <>
      <Header />
      {product && (
        <>
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'Product',
              name,
              description: description || undefined,
              image: product.media[0]?.url || undefined,
              brand: product.manufacturer ? { '@type': 'Brand', name: product.manufacturer } : undefined,
              offers: {
                '@type': 'Offer',
                price: product.sale_price ? Number(product.sale_price) : Number(product.price),
                priceCurrency: 'GEL',
                availability: product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                url: `${baseUrl}/${locale}/products/${id}`,
              },
            }}
          />
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'DentalMall',
                  item: `${baseUrl}/${locale}`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: categoryName,
                  item: `${baseUrl}/${locale}/categories/${product.category?.id}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name,
                  item: `${baseUrl}/${locale}/products/${id}`,
                },
              ],
            }}
          />
        </>
      )}
      <ProductDetail productId={id} />
    </>
  );
}
