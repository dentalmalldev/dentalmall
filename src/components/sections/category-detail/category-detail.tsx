"use client";

import { Box, Grid, Typography } from "@mui/material";
import { useMessages, useTranslations } from "next-intl";
import { CategorySidebar } from "../all-categories/category-sidebar";
import { CategoryCard } from "../all-categories/category-card";
import { CategoriesHeader } from "../categories-header";

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface CategoryDetailProps {
  categoryId: string;
}

export function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const messages = useMessages();
  const t = useTranslations("categoriesSection");
  const categories = messages.categories as Category[];

  const currentCategory = categories.find((cat) => cat.id === categoryId);

  if (!currentCategory) {
    return (
      <Box sx={{ padding: { xs: "16px", md: "28px 120px" } }}>
        <Typography>Category not found</Typography>
      </Box>
    );
  }

  const hasSubcategories = currentCategory.subcategories && currentCategory.subcategories.length > 0;

  return (
    <Box
      sx={{
        padding: { xs: "16px", md: "28px 120px" },
        paddingBottom: { xs: "100px", md: "40px" },
      }}
    >
      <CategoriesHeader categoryId={categoryId} />

      <Box
        sx={{
          display: "flex",
          gap: 4,
          alignItems: "flex-start",
        }}
      >
        <CategorySidebar selectedCategory={categoryId} />

        <Box sx={{ flex: 1 }}>
          {hasSubcategories ? (
            <Grid container spacing={2}>
              {currentCategory.subcategories.map((subcategory) => (
                <Grid
                  key={subcategory.id}
                  size={{ xs: 6, sm: 4, md: 3, lg: 3 }}
                >
                  <CategoryCard
                    id={subcategory.id}
                    name={subcategory.name}
                    parentCategoryId={categoryId}
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
                {t("noSubcategories") || "No subcategories available"}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
