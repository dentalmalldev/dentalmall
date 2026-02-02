import { Header } from "@/components";
import { ProductDetail } from "@/components/sections/product-detail";
import { prisma } from "@/lib";

type Params = Promise<{ id: string; locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id, locale } = await params;

  const product = await prisma.products.findUnique({
    where: { id },
    select: {
      name: true,
      name_ka: true,
      description: true,
      description_ka: true,
    },
  });

  if (!product) {
    return {
      title: "Product Not Found | DentalMall",
    };
  }

  const name = locale === "ka" ? product.name_ka : product.name;
  const description =
    locale === "ka" ? product.description_ka : product.description;

  return {
    title: `${name} | DentalMall`,
    description: description || `Buy ${name} from DentalMall`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  return (
    <>
      {" "}
      <Header />
      <ProductDetail productId={id} />
    </>
  );
}
