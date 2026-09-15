import { Product, Category, Media, VariantOption } from '@/types/models';

/**
 * Builds the admin product export workbook.
 *
 * Deliberately client-side: Vercel functions have a hard wall-clock limit, and
 * a workbook is a zip that can only be written once every row is in memory, so
 * a server route would have to hold the whole catalogue and finish inside that
 * budget. Building it in the browser removes the deadline entirely — the only
 * server work is the paged reads, each of which is a small, ordinary query.
 */

/** Excel chokes on very long single cells; URLs are joined one per line. */
const joinUrls = (media: Media[]) => media.map((m) => m.url).join('\n');

const decimal = (value: string | null | undefined) =>
  value === null || value === undefined || value === '' ? null : Number(value);

const yesNo = (value: boolean) => (value ? 'yes' : 'no');

/** Leaf category plus its parent, resolved from the hierarchical category list. */
function categoryPath(product: Product, categories: Category[]) {
  for (const parent of categories) {
    if (parent.id === product.category_id) return { parent: parent.name, leaf: '' };
    const child = parent.children?.find((c) => c.id === product.category_id);
    if (child) return { parent: parent.name, leaf: child.name };
  }
  return { parent: product.category?.name ?? '', leaf: '' };
}

function productRow(product: Product, categories: Category[]) {
  const media = product.media ?? [];
  // Untagged images are the general gallery; the rest belong to a variant.
  const gallery = media.filter((m) => !m.variant_option_id);
  const variantImages = media.filter((m) => m.variant_option_id);
  const options = (product.variant_types ?? []).flatMap((vt) => vt.options ?? []);
  const optionsWithoutImage = options.filter(
    (o) => !media.some((m) => m.variant_option_id === o.id)
  );
  const { parent, leaf } = categoryPath(product, categories);

  return {
    id: product.id,
    sku: product.sku,
    name_en: product.name,
    name_ka: product.name_ka,
    description_en: product.description ?? '',
    description_ka: product.description_ka ?? '',
    manufacturer: product.manufacturer ?? '',
    category: parent,
    subcategory: leaf,
    vendor: product.vendor?.company_name ?? '',
    price: decimal(product.price),
    dentalmall_price: decimal(product.dentalmall_price),
    sale_price: decimal(product.sale_price),
    discount_percent: product.discount_percent ?? null,
    unit: product.unit ?? '',
    stock: product.stock,
    in_storage_stock: yesNo(product.in_storage_stock ?? true),
    variant_count: options.length,
    // The photo-coverage columns mirror the admin "Photos" filter, so an export
    // of a filtered list can be worked through offline.
    image_count: media.length,
    gallery_image_count: gallery.length,
    variant_image_count: variantImages.length,
    variants_missing_images: optionsWithoutImage.length,
    main_image_url: media[0]?.url ?? '',
    gallery_image_urls: joinUrls(gallery),
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

function variantRows(product: Product) {
  const media = product.media ?? [];
  return (product.variant_types ?? []).flatMap((variantType) =>
    (variantType.options ?? []).map((option: VariantOption) => {
      const optionMedia = media.filter((m) => m.variant_option_id === option.id);
      return {
        product_id: product.id,
        product_sku: product.sku,
        product_name_en: product.name,
        variant_type_en: variantType.name,
        variant_type_ka: variantType.name_ka,
        option_id: option.id,
        option_name_en: option.name,
        option_name_ka: option.name_ka,
        option_sku: option.sku,
        price: decimal(option.price),
        dentalmall_price: decimal(option.dentalmall_price),
        sale_price: decimal(option.sale_price),
        stock: option.stock,
        image_count: optionMedia.length,
        image_urls: joinUrls(optionMedia),
      };
    })
  );
}

/** Every media row, so image URLs are also available one-per-line. */
function imageRows(product: Product) {
  const optionNameById = new Map<string, string>();
  (product.variant_types ?? []).forEach((vt) =>
    (vt.options ?? []).forEach((o) => optionNameById.set(o.id, o.name))
  );
  return (product.media ?? []).map((m, index) => ({
    product_id: product.id,
    product_sku: product.sku,
    product_name_en: product.name,
    position: index + 1,
    variant_option: m.variant_option_id ? optionNameById.get(m.variant_option_id) ?? '' : '',
    url: m.url,
    original_name: m.original_name,
    type: m.type,
    size_bytes: m.size ?? null,
  }));
}

/**
 * Every column the rows declare, including ones that happen to be null in this
 * particular export. Without an explicit header list SheetJS writes no cell for
 * a null, so a column that is empty for every row disappears entirely and the
 * file's shape changes from one export to the next.
 */
function headerFor(rows: Record<string, unknown>[]) {
  const header: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!header.includes(key)) header.push(key);
    }
  }
  return header;
}

/** Widen columns a little; the URL columns are the ones that need it. */
function columnWidths(header: string[]) {
  return header.map((key) => ({
    wch: /url|description|name/.test(key) ? 42 : Math.max(12, key.length + 2),
  }));
}

export async function exportProductsToExcel(products: Product[], categories: Category[]) {
  // Loaded on demand so the ~400KB sheet library stays out of the admin bundle.
  const XLSX = await import('xlsx');

  const sheets: [string, Record<string, unknown>[]][] = [
    ['Products', products.map((p) => productRow(p, categories))],
    ['Variants', products.flatMap(variantRows)],
    ['Images', products.flatMap(imageRows)],
  ];

  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of sheets) {
    const header = headerFor(rows);
    const sheet = XLSX.utils.json_to_sheet(rows, { header });
    sheet['!cols'] = columnWidths(header);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  XLSX.writeFile(workbook, `products-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
