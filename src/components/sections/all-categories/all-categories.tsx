"use client";

import { Box, Grid, Skeleton } from "@mui/material";
import { useLocale } from "next-intl";
import { CategorySidebar } from "./category-sidebar";
import { CategoryCard } from "./category-card";
import { CategoriesHeader } from "../categories-header";
import { useCategories } from "@/hooks";

export function AllCategories() {
  const { data: categories = [], isLoading } = useCategories();
  const locale = useLocale();

  const getCategoryName = (category: { name: string; name_ka: string }) =>
    locale === "ka" ? category.name_ka : category.name;

  return (
    <Box
      sx={{
        padding: { xs: "16px", md: "28px 120px" },
        paddingBottom: { xs: "100px", md: "40px" },
      }}
    >
      <CategoriesHeader />

      <Box
        sx={{
          display: "flex",
          gap: 4,
          alignItems: "flex-start",
        }}
      >
        <CategorySidebar />

        <Box sx={{ flex: 1 }}>
          <Grid container spacing={2}>
            {isLoading
              ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Grid key={i} size={{ xs: 6, sm: 4, md: 3, lg: 3 }}>
                    <Skeleton variant="rounded" height={180} />
                  </Grid>
                ))
              : categories.map((category) => (
                  <Grid key={category.id} size={{ xs: 6, sm: 4, md: 3, lg: 3 }}>
                    <CategoryCard
                      slug={category.slug}
                      name={getCategoryName(category)}
                      image={category.image}
                    />
                  </Grid>
                ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
