"use client";

import { useState, useEffect } from "react";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import { useMessages, useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { ChevronDownIcon } from "@/icons";

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface CategorySidebarProps {
  selectedCategory?: string;
}

export function CategorySidebar({ selectedCategory }: CategorySidebarProps) {
  const messages = useMessages();
  const t = useTranslations("categoriesSection");
  const locale = useLocale();
  const categories = messages.categories as Category[];

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Auto-expand category that contains selected subcategory
  useEffect(() => {
    if (selectedCategory) {
      const parentCategory = categories.find((cat) =>
        cat.subcategories?.some((sub) => sub.id === selectedCategory)
      );
      if (parentCategory && !expandedCategories.includes(parentCategory.id)) {
        setExpandedCategories((prev) => [...prev, parentCategory.id]);
      }
      // Also expand if selectedCategory is the category itself
      if (categories.some((cat) => cat.id === selectedCategory)) {
        setExpandedCategories((prev) =>
          prev.includes(selectedCategory) ? prev : [...prev, selectedCategory]
        );
      }
    }
  }, [selectedCategory, categories]);

  const toggleCategory = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <Box
      sx={{
        width: "384px",
        minWidth: "384px",
        backgroundColor: "#F5F6FF",
        borderRadius: "24px",
        padding: "24px",
        display: { xs: "none", md: "block" },
        height: "fit-content",
      }}
    >
      <Typography
        sx={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#3E4388",
          marginBottom: 3,
        }}
      >
        {t("title")}
      </Typography>

      <Stack spacing={0.5}>
        {categories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const hasSubcategories =
            category.subcategories && category.subcategories.length > 0;
          const categoryPath = `/${locale}/categories/${category.id}`;
          const isCategoryActive = selectedCategory === category.id;

          return (
            <Box key={category.id}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                }}
              >
                <Link
                  href={categoryPath}
                  style={{ textDecoration: "none", flex: 1 }}
                >
                  <Typography
                    sx={{
                      fontSize: "16px",
                      fontWeight: 500,
                      color: isCategoryActive || isExpanded ? "#5B6ECD" : "#3E4388",
                      transition: "color 0.2s ease",
                      cursor: "pointer",
                      "&:hover": {
                        color: "#5B6ECD",
                      },
                    }}
                  >
                    {category.name}
                  </Typography>
                </Link>
                {hasSubcategories && (
                  <Box
                    onClick={(e) => toggleCategory(e, category.id)}
                    sx={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <ChevronDownIcon
                      width={20}
                      height={20}
                      color={isExpanded ? "#5B6ECD" : "#9292FF"}
                    />
                  </Box>
                )}
              </Box>

              {hasSubcategories && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      borderLeft: "2px solid #5B6ECD",
                      marginLeft: "8px",
                      paddingLeft: "16px",
                      marginBottom: 1,
                    }}
                  >
                    {category.subcategories.map((subcategory) => {
                      const subcategoryPath = `/${locale}/categories/${category.id}/${subcategory.id}`;
                      const isSelected = selectedCategory === subcategory.id;

                      return (
                        <Link
                          key={subcategory.id}
                          href={subcategoryPath}
                          style={{ textDecoration: "none" }}
                        >
                          <Box
                            sx={{
                              padding: "8px 0",
                              cursor: "pointer",
                              "&:hover": {
                                "& .subcategory-name": {
                                  color: "#5B6ECD",
                                },
                              },
                            }}
                          >
                            <Typography
                              className="subcategory-name"
                              sx={{
                                fontSize: "14px",
                                fontWeight: isSelected ? 500 : 400,
                                color: isSelected ? "#E91E63" : "#5A5A5A",
                                transition: "color 0.2s ease",
                              }}
                            >
                              {subcategory.name}
                            </Typography>
                          </Box>
                        </Link>
                      );
                    })}
                  </Box>
                </Collapse>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
