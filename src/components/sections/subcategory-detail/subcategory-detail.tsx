"use client";

import { CategoryProductsView } from "../category-detail/category-products-view";

interface SubcategoryDetailProps {
  categoryId: string; // parent category slug
  subcategoryId: string; // subcategory slug
}

// A subcategory page narrows the shared category view to a single subcategory.
export function SubcategoryDetail({ categoryId, subcategoryId }: SubcategoryDetailProps) {
  return <CategoryProductsView parentSlug={categoryId} subcategorySlug={subcategoryId} />;
}
