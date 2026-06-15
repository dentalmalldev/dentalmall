import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { parseProductTemplate, type ParsedProductRow } from '@/lib/excel/parseProductTemplate';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface PreviewRowError {
  field: string;
  message: string;
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
}

export interface PreviewResponse {
  fileErrors: string[];
  rows: PreviewRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
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

      // Bulk-resolve lookups in a single round-trip each rather than N queries
      const [categories, vendors, productSkuHits, variantSkuHits] = await Promise.all([
        prisma.categories.findMany({
          select: { id: true, name: true, name_ka: true, parent_id: true },
        }),
        prisma.vendors.findMany({
          where: { is_active: true },
          select: { id: true, company_name: true, email: true },
        }),
        // Pre-fetch existing product SKUs we'll potentially collide with
        prisma.products.findMany({
          where: {
            sku: { in: parsed.map((r) => r.sku).filter((s): s is string => !!s) },
          },
          select: { sku: true },
        }),
        prisma.variant_options.findMany({
          where: {
            sku: {
              in: parsed.flatMap((r) =>
                r.variant_options.map((o) => o.sku).filter((s): s is string => !!s)
              ),
            },
          },
          select: { sku: true },
        }),
      ]);

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
      const productSkuSet = new Set(productSkuHits.map((p) => p.sku));
      const variantSkuSet = new Set(variantSkuHits.map((v) => v.sku));

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
        // (missing name OR missing positive price) — the row imports without that
        // option. A row that listed variant names without prices simply becomes a
        // non-variant product that uses the row's main price.
        const usableOptions = r.variant_options.filter(
          (o) => !!o.name_en && o.dentalmall_price !== null && o.dentalmall_price > 0
        );
        const droppedOptionCount = r.variant_options.length - usableOptions.length;
        if (droppedOptionCount > 0) {
          warnings.push({
            field: 'variant_options',
            message: `${droppedOptionCount} variant option(s) skipped — missing name or DentalMall price`,
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

        // SKU collision (warning, auto-suffix handled at commit time)
        if (r.sku && productSkuSet.has(r.sku)) {
          warnings.push({
            field: 'sku',
            message: `SKU "${r.sku}" already exists — a unique suffix will be appended on import`,
          });
        }
        r.variant_options.forEach((o, idx) => {
          if (o.sku && variantSkuSet.has(o.sku)) {
            warnings.push({
              field: `variant_options[${idx}].sku`,
              message: `Variant SKU "${o.sku}" already exists — a unique suffix will be appended`,
            });
          }
        });

        const finalCategoryId = subcategory_id || category_id;

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
          isValid: errors.length === 0,
        };
      });

      const response: PreviewResponse = {
        fileErrors,
        rows: previewRows,
        summary: {
          total: previewRows.length,
          valid: previewRows.filter((r) => r.isValid).length,
          invalid: previewRows.filter((r) => !r.isValid).length,
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
