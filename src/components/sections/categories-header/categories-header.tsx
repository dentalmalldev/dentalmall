"use client";

import { Box, Stack, Typography, Button, Chip, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { useMessages, useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { TrashIcon, ChevronDownIcon } from "@/icons";

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface FilterChip {
  id: string;
  label: string;
  type: "price" | "brand" | "other";
}

interface CategoriesHeaderProps {
  categoryId?: string;
  subcategoryId?: string;
  filters?: FilterChip[];
  onRemoveFilter?: (filterId: string) => void;
  onClearFilters?: () => void;
  sortValue?: string;
  onSortChange?: (value: string) => void;
}

export function CategoriesHeader({
  categoryId,
  subcategoryId,
  filters = [],
  onRemoveFilter,
  onClearFilters,
  sortValue = "default",
  onSortChange,
}: CategoriesHeaderProps) {
  const messages = useMessages();
  const t = useTranslations();
  const locale = useLocale();
  const categories = messages.categories as Category[];

  const currentCategory = categoryId
    ? categories.find((cat) => cat.id === categoryId)
    : null;

  const currentSubcategory = currentCategory?.subcategories?.find(
    (sub) => sub.id === subcategoryId
  );

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    onSortChange?.(event.target.value);
  };

  // Build breadcrumb items
  const breadcrumbs = [
    { label: t("navigation.category"), href: `/${locale}/categories` },
  ];

  if (currentCategory) {
    breadcrumbs.push({
      label: currentCategory.name,
      href: `/${locale}/categories/${currentCategory.id}`,
    });
  }

  if (currentSubcategory) {
    breadcrumbs.push({
      label: currentSubcategory.name,
      href: `/${locale}/categories/${currentCategory?.id}/${currentSubcategory.id}`,
    });
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        marginBottom: 3,
      }}
    >
      {/* Left side: Breadcrumbs */}
      <Stack direction="row" alignItems="center" spacing={1}>
        {breadcrumbs.map((crumb, index) => (
          <Stack key={crumb.href} direction="row" alignItems="center" spacing={1}>
            {index > 0 && (
              <Typography sx={{ color: "#A8B0BA", fontSize: "14px" }}>
                {">"}
              </Typography>
            )}
            {index === breadcrumbs.length - 1 ? (
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#3E4388",
                }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link href={crumb.href} style={{ textDecoration: "none" }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#5A5A5A",
                    "&:hover": {
                      color: "#5B6ECD",
                    },
                  }}
                >
                  {crumb.label}
                </Typography>
              </Link>
            )}
          </Stack>
        ))}
      </Stack>

      {/* Right side: Filters and Sorting */}
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Clear filters button */}
        {filters.length > 0 && (
          <Button
            onClick={onClearFilters}
            startIcon={<TrashIcon width={18} height={18} color="#5B6ECD" />}
            sx={{
              color: "#5B6ECD",
              backgroundColor: "#F5F6FF",
              borderRadius: "20px",
              padding: "8px 16px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "#ECEEFF",
              },
            }}
          >
            {t("actions.clearFilters") || "გასუფთავება"}
          </Button>
        )}

        {/* Filter chips */}
        {filters.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            onDelete={() => onRemoveFilter?.(filter.id)}
            sx={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8E8E8",
              borderRadius: "20px",
              padding: "4px 8px",
              "& .MuiChip-label": {
                fontSize: "14px",
                color: "#3E4388",
                fontWeight: 500,
              },
              "& .MuiChip-deleteIcon": {
                color: "#A8B0BA",
                "&:hover": {
                  color: "#5B6ECD",
                },
              },
            }}
          />
        ))}

        {/* Sort dropdown */}
        <Select
          value={sortValue}
          onChange={handleSortChange}
          IconComponent={() => (
            <Box sx={{ marginRight: 1, display: "flex", alignItems: "center" }}>
              <ChevronDownIcon width={16} height={16} color="#5B6ECD" />
            </Box>
          )}
          sx={{
            minWidth: 150,
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E8E8",
            borderRadius: "20px",
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiSelect-select": {
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#3E4388",
            },
          }}
        >
          <MenuItem value="default">{t("sorting.default") || "სორტირება"}</MenuItem>
          <MenuItem value="price_asc">{t("sorting.priceAsc") || "ფასი: დაბალი"}</MenuItem>
          <MenuItem value="price_desc">{t("sorting.priceDesc") || "ფასი: მაღალი"}</MenuItem>
          <MenuItem value="name_asc">{t("sorting.nameAsc") || "დასახელება: ა-ჰ"}</MenuItem>
          <MenuItem value="name_desc">{t("sorting.nameDesc") || "დასახელება: ჰ-ა"}</MenuItem>
          <MenuItem value="newest">{t("sorting.newest") || "უახლესი"}</MenuItem>
        </Select>
      </Stack>
    </Box>
  );
}
