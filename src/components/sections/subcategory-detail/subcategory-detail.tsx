"use client";

import { Box, Grid, Typography } from "@mui/material";
import { useMessages, useTranslations } from "next-intl";
import { CategorySidebar } from "../all-categories/category-sidebar";
import { CategoriesHeader } from "../categories-header";
import { ProductCard } from "@/components/common";
import { getProductsBySubcategory } from "@/lib/mock-data";

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface SubcategoryDetailProps {
  categoryId: string;
  subcategoryId: string;
}

export function SubcategoryDetail({ categoryId, subcategoryId }: SubcategoryDetailProps) {
  const messages = useMessages();
  const t = useTranslations("productsSection");
  const categories = messages.categories as Category[];

  const currentCategory = categories.find((cat) => cat.id === categoryId);
  const currentSubcategory = currentCategory?.subcategories?.find(
    (sub) => sub.id === subcategoryId
  );

  const products = getProductsBySubcategory(subcategoryId);

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
              {products.map((product) => (
                <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    manufacturer={product.manufacturer}
                    image={product.image}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    discount={product.discount}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                padding: 4,
                backgroundColor: "#F5F6FF",
                borderRadius: "12px",
              }}
            >
              <Typography color="text.secondary">
                {t("noProducts") || "No products found in this category"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
