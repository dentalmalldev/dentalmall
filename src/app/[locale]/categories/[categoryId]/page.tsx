import { Header } from "@/components/layout/header/header";
import { CategoryDetail } from "@/components/sections/category-detail";

type Props = {
  params: Promise<{ locale: string; categoryId: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params;

  return (
    <>
      <Header />
      <CategoryDetail categoryId={categoryId} />
    </>
  );
}
