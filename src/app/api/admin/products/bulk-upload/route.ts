import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { parseProductTemplate, type ParsedProductRow } from '@/lib/excel/parseProductTemplate';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface PreviewRowError {
  field: string;
  message: string;
}

export type RowStatus = 'new' | 'update' | 'unchanged' | 'error';

export interface FieldDiff {
  field: string;
  from: string;
  to: string;
}

export interface PreviewRow {
  rowNumber: number;
  raw: ParsedProductRow;
  /** Resolved DB IDs (only present when the row passes resolution) */
  resolved: {
    category_id: string | null;
    subcategory_id: string | null;
    vendor_id: string | null;
  };
  errors: PreviewRowError[];
  warnings: PreviewRowError[];
  isValid: boolean;
  // Match result vs the existing catalog (by SKU).
  status: RowStatus;
  existing_product_id: string | null;
  /** Field-level changes for UPDATE rows. */
  diff: FieldDiff[];
}

export interface PreviewResponse {
  fileErrors: string[];
  rows: PreviewRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    new: number;
    update: number;
    unchanged: number;
    error: number;
  };
}

// Existing product shape loaded for diffing (matches the select above).
interface ExistingProduct {
  id: string;
  name: string;
  name_ka: string;
  description: string | null;
  description_ka: string | null;
  manufacturer: string | null;
  price: unknown;
  dentalmall_price: unknown;
  unit: string | null;
  stock: number;
  in_storage_stock: boolean;
  category_id: string;
  vendor_id: string | null;
  variant_types: {
    options: { sku: string; name: string; name_ka: string; price: unknown; dentalmall_price: unknown; stock: number }[];
  }[];
}

const num = (v: unknown) => parseFloat(String(v)) || 0;

/**
 * Field-level diff of a parsed row against an existing product. Empty Excel
 * cells are treated as "no change" (skipped) — except stock, which always
 * overwrites. Images are never part of the template so they're never touched.
 */
function computeDiff(
  row: ParsedProductRow,
  resolved: { category_id: string | null; vendor_id: string | null },
  existing: ExistingProduct,
  names: { category: Map<string, string>; vendor: Map<string, string> }
): FieldDiff[] {
  const diff: FieldDiff[] = [];
  const change = (field: string, from: string, to: string) => {
    if (from !== to) diff.push({ field, from: from || '(none)', to: to || '(none)' });
  };

  change('name', existing.name, row.name_en);
  if (row.name_ka.trim()) change('name_ka', existing.name_ka, row.name_ka);
  change('description', existing.description ?? '', row.description_en);
  if (row.description_ka.trim()) change('description_ka', existing.description_ka ?? '', row.description_ka);
  if (row.manufacturer && row.manufacturer.trim()) {
    change('manufacturer', existing.manufacturer ?? '', row.manufacturer);
  }
  if (row.unit && row.unit.trim()) {
    change('unit', existing.unit ?? '', row.unit.trim());
  }

  const hasVariants = row.variant_options.length > 0;
  if (!hasVariants && row.price !== null) {
    change('price', num(existing.price).toFixed(2), row.price.toFixed(2));
  }
  if (!hasVariants && row.dentalmall_price !== null) {
    change('dentalmall_price', num(existing.dentalmall_price).toFixed(2), row.dentalmall_price.toFixed(2));
  }

  // Stock always overwrites; in_storage_stock is re-derived from it.
  const newStock = row.quantity ?? 0;
  change('stock', String(existing.stock), String(newStock));
  change('in_storage_stock', String(existing.in_storage_stock), String(newStock > 0));

  if (resolved.category_id && resolved.category_id !== existing.category_id) {
    change(
      'category',
      names.category.get(existing.category_id) ?? existing.category_id,
      names.category.get(resolved.category_id) ?? resolved.category_id
    );
  }
  // A vendor is only changed when one was specified (never cleared via upload).
  if (resolved.vendor_id && resolved.vendor_id !== existing.vendor_id) {
    change(
      'vendor',
      existing.vendor_id ? names.vendor.get(existing.vendor_id) ?? existing.vendor_id : '',
      names.vendor.get(resolved.vendor_id) ?? resolved.vendor_id
    );
  }

  // Variants matched by SKU: count adds (new SKU) and updates (field changed).
  const existingOptions = new Map(
    existing.variant_types.flatMap((vt) => vt.options).map((o) => [o.sku, o])
  );
  let added = 0;
  let updated = 0;
  for (const o of row.variant_options) {
    const match = o.sku ? existingOptions.get(o.sku) : undefined;
    if (!match) {
      added++;
    } else if (
      match.name !== o.name_en ||
      match.name_ka !== (o.name_ka || o.name_en) ||
      num(match.price) !== (o.price ?? 0) ||
      // An empty cost cell means "leave as is", like the other optional fields.
      (o.dentalmall_price !== null && num(match.dentalmall_price) !== o.dentalmall_price) ||
      match.stock !== (o.quantity ?? 0)
    ) {
      updated++;
    }
  }
  if (added > 0 || updated > 0) {
    change('variants', String(existingOptions.size), `+${added} new, ${updated} updated`);
  }

  return diff;
}

/**
 * Parse + validate the uploaded template. Returns row-level status so the
 * client can render a preview before committing. No DB writes happen here.
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const formData = await req.formData();
      const file = formData.get('file');
      const batchVendorIdRaw = formData.get('vendor_id');
      const batchVendorId =
        typeof batchVendorIdRaw === 'string' && batchVendorIdRaw.trim() !== ''
          ? batchVendorIdRaw.trim()
          : null;
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File exceeds the 5MB limit (got ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
          { status: 400 }
        );
      }

      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
        return NextResponse.json(
          { error: 'Only .xlsx or .xls files are accepted' },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { rows: parsed, fileErrors } = parseProductTemplate(buffer);

      // Bulk-resolve lookups in a single round-trip each rather than N queries.
      // Existing products are loaded in full (by SKU) so each row can be diffed.
      const [categories, vendors, existingProducts] = await Promise.all([
        prisma.categories.findMany({
          select: { id: true, name: true, name_ka: true, parent_id: true },
        }),
        prisma.vendors.findMany({
          where: { is_active: true },
          select: { id: true, company_name: true, email: true },
        }),
        prisma.products.findMany({
          where: {
            sku: { in: parsed.map((r) => r.sku).filter((s): s is string => !!s) },
          },
          select: {
            id: true,
            sku: true,
            name: true,
            name_ka: true,
            description: true,
            description_ka: true,
            manufacturer: true,
            price: true,
            dentalmall_price: true,
            unit: true,
            stock: true,
            in_storage_stock: true,
            category_id: true,
            vendor_id: true,
            variant_types: {
              select: {
                options: {
                  select: { sku: true, name: true, name_ka: true, price: true, dentalmall_price: true, stock: true },
                },
              },
            },
          },
        }),
      ]);
      const productBySku = new Map(existingProducts.map((p) => [p.sku, p]));
      // Id → display name maps for readable category/vendor diffs.
      const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
      const vendorNameById = new Map(vendors.map((v) => [v.id, v.company_name]));

      const categoryByName = new Map<string, { id: string; parent_id: string | null }>();
      for (const c of categories) {
        // Index by both EN and KA name so admins can use either
        categoryByName.set(c.name.trim().toLowerCase(), { id: c.id, parent_id: c.parent_id });
        categoryByName.set(c.name_ka.trim().toLowerCase(), { id: c.id, parent_id: c.parent_id });
      }
      const vendorByLabel = new Map<string, string>();
      for (const v of vendors) {
        vendorByLabel.set(v.company_name.trim().toLowerCase(), v.id);
        if (v.email) vendorByLabel.set(v.email.trim().toLowerCase(), v.id);
      }

      // Validate the batch vendor selection, if provided
      if (batchVendorId && !vendors.some((v) => v.id === batchVendorId)) {
        return NextResponse.json(
          { error: 'Selected vendor not found or inactive' },
          { status: 400 }
        );
      }
      const previewRows: PreviewRow[] = parsed.map((r) => {
        const errors: PreviewRowError[] = [];
        const warnings: PreviewRowError[] = [];

        // Required fields
        if (!r.name_en) errors.push({ field: 'name_en', message: 'Product name (EN) is required' });
        if (!r.description_en) errors.push({ field: 'description_en', message: 'Description (EN) is required' });
        // Quantity is optional: empty/0 means the item isn't stocked in DentalMall's
        // warehouse — it imports as a special-order product (in_storage_stock = false).
        // Only a negative value is invalid.
        if (r.quantity !== null && r.quantity < 0) {
          errors.push({ field: 'quantity', message: 'Quantity supplied must be ≥ 0' });
        }
        if (!r.category) errors.push({ field: 'category', message: 'Category is required' });

        // Category resolution
        let category_id: string | null = null;
        let subcategory_id: string | null = null;
        if (r.category) {
          const match = categoryByName.get(r.category.trim().toLowerCase());
          if (!match) {
            errors.push({ field: 'category', message: `Category "${r.category}" not found` });
          } else {
            category_id = match.id;
          }
        }
        if (r.subcategory) {
          const match = categoryByName.get(r.subcategory.trim().toLowerCase());
          if (!match) {
            errors.push({ field: 'subcategory', message: `Subcategory "${r.subcategory}" not found` });
          } else if (category_id && match.parent_id !== category_id) {
            errors.push({
              field: 'subcategory',
              message: `Subcategory "${r.subcategory}" does not belong to category "${r.category}"`,
            });
          } else {
            // Use subcategory as the actual category_id; the parent is the section
            subcategory_id = match.id;
          }
        }

        // Vendor: batch-level selection from the modal takes precedence.
        // Falls back to the spreadsheet's vendor column for backwards compat;
        // an unknown spreadsheet vendor is just a warning (not blocking).
        let vendor_id: string | null = batchVendorId;
        if (!vendor_id && r.vendor) {
          const match = vendorByLabel.get(r.vendor.trim().toLowerCase());
          if (match) {
            vendor_id = match;
          } else {
            warnings.push({
              field: 'vendor',
              message: `Vendor "${r.vendor}" from the spreadsheet not found — product will import without a vendor`,
            });
          }
        }

        // Variants are optional. Silently drop any option that's incomplete
        // (missing name OR missing positive selling price) — the row imports
        // without that option. A row that listed variant names without prices
        // simply becomes a non-variant product that uses the row's main price.
        const usableOptions = r.variant_options.filter(
          (o) => !!o.name_en && o.price !== null && o.price > 0
        );
        const droppedOptionCount = r.variant_options.length - usableOptions.length;
        if (droppedOptionCount > 0) {
          warnings.push({
            field: 'variant_options',
            message: `${droppedOptionCount} variant option(s) skipped — missing name or price`,
          });
        }
        // Mutate the raw row so the commit endpoint sees the filtered list
        r.variant_options = usableOptions;
        const hasUsableOptions = usableOptions.length > 0;

        // Price: required only when there are no usable variants to price from
        if (!hasUsableOptions && (r.price === null || r.price <= 0)) {
          errors.push({
            field: 'price',
            message: 'Price is required when product has no variants',
          });
        }

        const finalCategoryId = subcategory_id || category_id;
        const isValid = errors.length === 0;

        // Match against the existing catalog by main SKU → NEW / UPDATE / UNCHANGED.
        const existing = r.sku ? productBySku.get(r.sku) : undefined;
        let status: RowStatus = 'new';
        let diff: FieldDiff[] = [];
        if (!isValid) {
          status = 'error';
        } else if (existing) {
          diff = computeDiff(r, { category_id: finalCategoryId, vendor_id }, existing, {
            category: categoryNameById,
            vendor: vendorNameById,
          });
          status = diff.length > 0 ? 'update' : 'unchanged';
        }

        return {
          rowNumber: r.rowNumber,
          raw: r,
          resolved: {
            category_id: finalCategoryId,
            subcategory_id,
            vendor_id,
          },
          errors,
          warnings,
          isValid,
          status,
          existing_product_id: existing?.id ?? null,
          diff,
        };
      });

      const countStatus = (s: RowStatus) => previewRows.filter((r) => r.status === s).length;
      const response: PreviewResponse = {
        fileErrors,
        rows: previewRows,
        summary: {
          total: previewRows.length,
          valid: previewRows.filter((r) => r.isValid).length,
          invalid: previewRows.filter((r) => !r.isValid).length,
          new: countStatus('new'),
          update: countStatus('update'),
          unchanged: countStatus('unchanged'),
          error: countStatus('error'),
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Bulk-upload parse error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to parse upload' },
        { status: 500 }
      );
    }
  });
}
