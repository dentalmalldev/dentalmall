export type ShopSortKey = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

export const SHOP_SORT_KEYS: ShopSortKey[] = [
  'newest',
  'price_asc',
  'price_desc',
  'name_asc',
  'name_desc',
];

export interface ShopFilterValues {
  minPrice: string;
  maxPrice: string;
  brands: string[];
  vendors: string[];
  availability: 'all' | 'in_stock' | 'preorder';
  onSale: boolean;
  hasVariants: boolean;
}

export const EMPTY_SHOP_FILTERS: ShopFilterValues = {
  minPrice: '',
  maxPrice: '',
  brands: [],
  vendors: [],
  availability: 'all',
  onSale: false,
  hasVariants: false,
};

export function countActiveFilters(v: ShopFilterValues): number {
  return (
    (v.minPrice || v.maxPrice ? 1 : 0) +
    (v.brands.length > 0 ? 1 : 0) +
    (v.vendors.length > 0 ? 1 : 0) +
    (v.availability !== 'all' ? 1 : 0) +
    (v.onSale ? 1 : 0) +
    (v.hasVariants ? 1 : 0)
  );
}
