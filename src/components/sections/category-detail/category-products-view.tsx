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

interface CategoryProductsViewProps {
  parentSlug: string; // parent category slug (for the breadcrumb header)
  subcategorySlug?: string; // when set, narrows to just this subcategory
}

/**
 * Shared shop view for a category page (parent → products across all its
 * subcategories) and a subcategory page (narrowed to one subcategory). The
 * public products/facets API expands a parent category slug to include its
 * children, so the same query serves both.
 */
export function CategoryProductsView({ parentSlug, subcategorySlug }: CategoryProductsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("shop");
  const gridRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The active category to query + highlight: the subcategory when on a
  // subcategory page, otherwise the parent category itself.
  const activeSlug = subcategorySlug ?? parentSlug;

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
  const { data: facets } = useProductFacets({ category_slug: activeSlug });
  const { data: productsData, isLoading: productsLoading, isFetching } = useProducts({
    category_slug: activeSlug,
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

  const getName = (c: { name: string; name_ka: string }) => (locale === "ka" ? c.name_ka : c.name);
  const getProductName = getName;

  const parentCategory = categories.find((cat) => cat.slug === parentSlug);
  const activeCategory = subcategorySlug
    ? parentCategory?.children?.find((child) => child.slug === subcategorySlug)
    : parentCategory;
  const products = productsData?.data || [];

  if (categoriesLoading) {
    return (
      <Box sx={{ py: { xs: 2, md: 3.5 } }}>
        <Skeleton variant="text" width={300} height={40} />
        <Box sx={{ display: "flex", gap: 4, mt: 2 }}>
          <Skeleton variant="rounded" width={384} height={400} sx={{ display: { xs: "none", md: "block" } }} />
          <Grid container spacing={2} sx={{ flex: 1 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid key={i} size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
                <Skeleton variant="rounded" height={380} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  if (!parentCategory || !activeCategory) {
    return (
      <Box sx={{ py: { xs: 2, md: 3.5 } }}>
        <Typography>{t("categoryNotFound")}</Typography>
      </Box>
    );
  }

  const renderGridBody = () => {
    if (productsLoading) {
      return (
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
              <Skeleton variant="rounded" height={380} />
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
        <Grid container spacing={2} sx={{ opacity: isFetching ? 0.6 : 1, transition: "opacity 0.2s" }}>
          {products.map((product) => {
            const pricing = getProductDisplayPricing(product);
            return (
              <Grid key={product.id} size={{ xs: 6, sm: 6, md: 6, lg: 4 }}>
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
      <CategoriesHeader categoryId={parentSlug} subcategoryId={subcategorySlug} />

      <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
        {/* Left column: categories (navigation) + filters (refinement) — desktop */}
        <Box sx={{ display: { xs: "none", md: "block" }, width: 384, minWidth: 384 }}>
          <Stack spacing={3}>
            <CategorySidebar selectedCategory={activeSlug} />
            <FilterSidebar
              values={filterValues}
              facets={facets}
              onChange={handleDesktopChange}
              onClear={() => applyFilterValues(EMPTY_SHOP_FILTERS)}
            />
          </Stack>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }} ref={gridRef}>
          {/* Active category name heading */}
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
            {getName(activeCategory)}
          </Typography>

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
