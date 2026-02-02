"use client";

import { Box, Grid, Typography, Skeleton } from "@mui/material";
import { useTranslations, useLocale } from "next-intl";
import { CategorySidebar } from "../all-categories/category-sidebar";
import { CategoriesHeader } from "../categories-header";
import { ProductCard } from "@/components/common";
import { useProducts, useCategories } from "@/hooks";
import ProductNotFound from "@/components/common/product-not-found/product-not-found";

interface SubcategoryDetailProps {
  categoryId: string; // parent category slug
  subcategoryId: string; // subcategory slug
}

export function SubcategoryDetail({ categoryId, subcategoryId }: SubcategoryDetailProps) {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: productsData, isLoading: productsLoading } = useProducts({
    category_slug: subcategoryId,
    limit: 50,
  });
  const t = useTranslations("productsSection");
  const locale = useLocale();

  const getProductName = (product: { name: string; name_ka: string }) =>
    locale === "ka" ? product.name_ka : product.name;

  const currentCategory = categories.find((cat) => cat.slug === categoryId);
  const currentSubcategory = currentCategory?.children?.find(
    (child) => child.slug === subcategoryId
  );

  const products = productsData?.data || [];
  const isLoading = categoriesLoading || productsLoading;

  if (isLoading) {
    return (
      <Box sx={{ padding: { xs: "16px", md: "28px 120px" } }}>
        <Skeleton variant="text" width={300} height={40} />
        <Box sx={{ display: "flex", gap: 4, mt: 2 }}>
          <Skeleton variant="rounded" width={384} height={400} sx={{ display: { xs: "none", md: "block" } }} />
          <Grid container spacing={3} sx={{ flex: 1 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={350} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  if (!currentCategory || !currentSubcategory) {
    return (
      <Box sx={{ padding: { xs: "16px", md: "28px 120px" } }}>
        <Typography>Subcategory not found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: "16px", md: "28px 120px" },
        paddingBottom: { xs: "100px", md: "40px" },
      }}
    >
      <CategoriesHeader categoryId={categoryId} subcategoryId={subcategoryId} />

      <Box
        sx={{
          display: "flex",
          gap: 4,
          alignItems: "flex-start",
        }}
      >
        <CategorySidebar selectedCategory={subcategoryId} />

        <Box sx={{ flex: 1 }}>
          {products.length > 0 ? (
            <Grid container spacing={3}>
              {products.map((product) => {
                const price = parseFloat(product.price);
                const salePrice = product.sale_price ? parseFloat(product.sale_price) : undefined;
                const discount = salePrice ? Math.round((1 - salePrice / price) * 100) : undefined;

                return (
                  <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                    <ProductCard
                      id={product.id}
                      name={getProductName(product)}
                      manufacturer={product.category?.name || ""}
                      image={product?.media ? product.media[0].url : "/logos/products/placeholder.jpg"}
                      price={salePrice || price}
                      originalPrice={salePrice ? price : undefined}
                      discount={discount}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <ProductNotFound/>
          )}
        </Box>
      </Box>
    </Box>
  );
}
