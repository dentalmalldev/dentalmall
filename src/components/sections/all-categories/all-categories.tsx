"use client";

import { Box, Grid } from "@mui/material";
import { useMessages } from "next-intl";
import { CategorySidebar } from "./category-sidebar";
import { CategoryCard } from "./category-card";
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

export function AllCategories() {
  const messages = useMessages();
  const categories = messages.categories as Category[];

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
            {categories.map((category) => (
              <Grid
                key={category.id}
                size={{ xs: 6, sm: 4, md: 3, lg: 3 }}
              >
                <CategoryCard id={category.id} name={category.name} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
