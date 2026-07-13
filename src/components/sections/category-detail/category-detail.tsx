"use client";

import { CategoryProductsView } from "./category-products-view";

interface CategoryDetailProps {
  categoryId: string; // parent category slug
}

// A parent category page now shows products from the category + all its
// subcategories (the sidebar still handles subcategory navigation).
export function CategoryDetail({ categoryId }: CategoryDetailProps) {
  return <CategoryProductsView parentSlug={categoryId} />;
}
