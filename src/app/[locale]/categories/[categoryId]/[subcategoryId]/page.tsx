import { Header } from "@/components/layout/header/header";
import { SubcategoryDetail } from "@/components/sections/subcategory-detail";

type Props = {
  params: Promise<{ locale: string; categoryId: string; subcategoryId: string }>;
};

export default async function SubcategoryPage({ params }: Props) {
  const { categoryId, subcategoryId } = await params;

  return (
    <>
      <Header />
      <SubcategoryDetail categoryId={categoryId} subcategoryId={subcategoryId} />
    </>
  );
}
