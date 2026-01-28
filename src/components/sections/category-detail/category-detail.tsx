"use client";

import { Box, Grid, Typography, Skeleton } from "@mui/material";
import { useTranslations, useLocale } from "next-intl";
import { CategorySidebar } from "../all-categories/category-sidebar";
import { CategoryCard } from "../all-categories/category-card";
import { CategoriesHeader } from "../categories-header";
import { useCategories } from "@/hooks";

interface CategoryDetailProps {
  categoryId: string; // This is actually the slug
}

export function CategoryDetail({ categoryId }: CategoryDetailProps) {
  const { data: categories = [], isLoading } = useCategories();
  const t = useTranslations("categoriesSection");
  const locale = useLocale();

  const getCategoryName = (category: { name: string; name_ka: string }) =>
    locale === "ka" ? category.name_ka : category.name;

  const currentCategory = categories.find((cat) => cat.slug === categoryId);

  if (isLoading) {
    return (
      <Box sx={{ padding: { xs: "16px", md: "28px 120px" } }}>
        <Skeleton variant="text" width={200} height={40} />
        <Box sx={{ display: "flex", gap: 4, mt: 2 }}>
          <Skeleton variant="rounded" width={384} height={400} sx={{ display: { xs: "none", md: "block" } }} />
          <Grid container spacing={2} sx={{ flex: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
                <Skeleton variant="rounded" height={180} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  if (!currentCategory) {
    return (
      <Box sx={{ padding: { xs: "16px", md: "28px 120px" } }}>
        <Typography>Category not found</Typography>
      </Box>
    );
  }

  const hasChildren = currentCategory.children && currentCategory.children.length > 0;

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
          {hasChildren ? (
            <Grid container spacing={2}>
              {currentCategory.children!.map((child) => (
                <Grid
                  key={child.id}
                  size={{ xs: 6, sm: 4, md: 3, lg: 3 }}
                >
                  <CategoryCard
                    slug={child.slug}
                    name={getCategoryName(child)}
                    image={child.image}
                    parentCategorySlug={categoryId}
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
