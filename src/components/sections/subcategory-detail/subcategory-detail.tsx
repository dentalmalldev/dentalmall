"use client";

import { useRef, useState } from "react";
import { Box, Grid, Typography, Skeleton, Stack, Button, Badge } from "@mui/material";
import { FilterList } from "@mui/icons-material";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CategorySidebar } from "../all-categories/category-sidebar";
import { CategoriesHeader } from "../categories-header";
import { ProductCard, PaginationControl } from "@/components/common";
import { useProducts, useProductFacets, useCategories } from "@/hooks";
import ProductNotFound from "@/components/common/product-not-found/product-not-found";
import { getProductDisplayPricing } from "@/lib/product-pricing";
import {
  FilterSidebar,
  FilterDrawer,
  SortDropdown,
  ShopFilterValues,
  ShopSortKey,
  EMPTY_SHOP_FILTERS,
  countActiveFilters,
} from "../shop";

const PAGE_SIZE = 24;

interface SubcategoryDetailProps {
  categoryId: string; // parent category slug
  subcategoryId: string; // subcategory slug
}

export function SubcategoryDetail({ categoryId, subcategoryId }: SubcategoryDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("shop");
  const gridRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const sort = (searchParams.get("sort") as ShopSortKey) || "newest";
  const filterValues: ShopFilterValues = {
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    brands: searchParams.getAll("brand"),
    vendors: searchParams.getAll("vendor"),
    availability: (searchParams.get("availability") as ShopFilterValues["availability"]) || "all",
    onSale: searchParams.get("onSale") === "true",
    hasVariants: searchParams.get("hasVariants") === "true",
  };
  const activeFilterCount = countActiveFilters(filterValues);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: facets } = useProductFacets({ category_slug: subcategoryId });
  const { data: productsData, isLoading: productsLoading, isFetching } = useProducts({
    category_slug: subcategoryId,
    page,
    limit: PAGE_SIZE,
    sort,
    minPrice: filterValues.minPrice ? Number(filterValues.minPrice) : undefined,
    maxPrice: filterValues.maxPrice ? Number(filterValues.maxPrice) : undefined,
    brands: filterValues.brands,
    vendors: filterValues.vendors,
    availability: filterValues.availability,
    onSale: filterValues.onSale,
    hasVariants: filterValues.hasVariants,
  });

  const writeParams = (params: URLSearchParams) => {
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Commit a full filter set to the URL (resets pagination to page 1).
  const applyFilterValues = (values: ShopFilterValues) => {
    const params = new URLSearchParams(searchParams.toString());
    ["minPrice", "maxPrice", "availability", "onSale", "hasVariants", "page", "brand", "vendor"].forEach((k) =>
      params.delete(k)
    );
    if (values.minPrice) params.set("minPrice", values.minPrice);
    if (values.maxPrice) params.set("maxPrice", values.maxPrice);
    values.brands.forEach((b) => params.append("brand", b));
    values.vendors.forEach((v) => params.append("vendor", v));
    if (values.availability !== "all") params.set("availability", values.availability);
    if (values.onSale) params.set("onSale", "true");
    if (values.hasVariants) params.set("hasVariants", "true");
    writeParams(params);
  };

  const handleDesktopChange = (patch: Partial<ShopFilterValues>) =>
    applyFilterValues({ ...filterValues, ...patch });

  const handleSortChange = (next: ShopSortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "newest") params.delete("sort");
    else params.set("sort", next);
    params.delete("page");
    writeParams(params);
  };

  const handlePageChange = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    writeParams(params);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getProductName = (product: { name: string; name_ka: string }) =>
    locale === "ka" ? product.name_ka : product.name;

  const currentCategory = categories.find((cat) => cat.slug === categoryId);
  const currentSubcategory = currentCategory?.children?.find((child) => child.slug === subcategoryId);
  const products = productsData?.data || [];

  if (categoriesLoading) {
    return (
      <Box sx={{ py: { xs: 2, md: 3.5 } }}>
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
      <Box sx={{ py: { xs: 2, md: 3.5 } }}>
        <Typography>Subcategory not found</Typography>
      </Box>
    );
  }

  const renderGridBody = () => {
    if (productsLoading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={350} />
            </Grid>
          ))}
        </Grid>
      );
    }
    if (products.length === 0) {
      return <ProductNotFound />;
    }
    return (
      <>
        <Grid container spacing={3} sx={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 0.2s" }}>
          {products.map((product) => {
            const pricing = getProductDisplayPricing(product);
            return (
              <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <ProductCard
                  id={product.id}
                  name={getProductName(product)}
                  manufacturer={product.category?.name || ""}
                  image={product?.media?.[0]?.url || "/logos/placeholder.jpg"}
                  price={pricing.minPrice}
                  originalPrice={pricing.minOriginalPrice ?? undefined}
                  discount={pricing.discount ?? undefined}
                  fromLabel={pricing.hasVariants}
                  variantTypes={product.variant_types}
                  inStorageStock={product.in_storage_stock}
                />
              </Grid>
            );
          })}
        </Grid>
        <PaginationControl
          page={page}
          pageSize={PAGE_SIZE}
          total={productsData?.pagination?.total ?? 0}
          onPageChange={handlePageChange}
        />
      </>
    );
  };

  return (
    <Box sx={{ pt: { xs: 2, md: 3.5 }, pb: { xs: "100px", md: "40px" } }}>
      <CategoriesHeader categoryId={categoryId} subcategoryId={subcategoryId} />

      <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
        {/* Left column: categories (navigation) + filters (refinement) — desktop */}
        <Box sx={{ display: { xs: "none", md: "block" }, width: 384, minWidth: 384 }}>
          <Stack spacing={3}>
            <CategorySidebar selectedCategory={subcategoryId} />
            <FilterSidebar
              values={filterValues}
              facets={facets}
              onChange={handleDesktopChange}
              onClear={() => applyFilterValues(EMPTY_SHOP_FILTERS)}
            />
          </Stack>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }} ref={gridRef}>
          {/* Toolbar: mobile Filters button + sort */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Button
              variant="outlined"
              startIcon={
                <Badge badgeContent={activeFilterCount} color="primary">
                  <FilterList />
                </Badge>
              }
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              {t("filters")}
            </Button>
            <Box sx={{ display: { xs: "none", md: "block" } }} />
            <SortDropdown value={sort} onChange={handleSortChange} />
          </Stack>

          {renderGridBody()}
        </Box>
      </Box>

      {/* Mobile filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialValues={filterValues}
        facets={facets}
        onApply={applyFilterValues}
      />
    </Box>
  );
}
