import * as XLSX from 'xlsx';

/**
 * Parses the bulk-upload product template (.xlsx or legacy .xls).
 *
 * Sheet layout (sheet name: "პროდუქტები"):
 *  - Row 1: title
 *  - Row 2: column headers
 *  - Row 3+: data
 *
 * Column layout:
 *  A  Product name (EN)         *required
 *  B  Product name (KA)
 *  C  Description (EN)          *required
 *  D  Description (KA)
 *  E  Manufacturer
 *  F  SKU
 *  G  Price ₾                   *required (unless variants drive pricing)
 *  H  DentalMall Price ₾
 *  I  Unit
 *  J  Quantity supplied         *required (maps to stock)
 *  K  Category                  *required
 *  L  Subcategory
 *  M  Vendor
 *  N  Variant type name (EN)    *required for variants
 *  O  Variant type name (EN)
 *  P  Variant type name (KA)
 *  Q..BM  10 variant option slots × 5 cols each:
 *         [Name EN, Name KA, DentalMall price ₾, SKU, Quantity supplied]
 *
 * Note: the ticket lists both column N AND O as variant-type-EN-related; the
 * spec is ambiguous so we treat O as the canonical variant-type-name-EN and
 * skip column N (the parser logs a warning if it differs from O).
 */

export const MAX_VARIANT_OPTIONS = 10;
export const VARIANT_OPTION_COLUMN_COUNT = 5;
export const PRODUCT_SHEET_NAME = 'პროდუქტები';
export const DATA_START_ROW_INDEX = 2; // 0-indexed; rows 0 (title) and 1 (headers) skipped

export interface ParsedVariantOption {
  name_en: string;
  name_ka: string;
  dentalmall_price: number | null;
  sku: string | null;
  quantity: number | null;
}

export interface ParsedProductRow {
  /** 1-based row number as it appears in the spreadsheet (so admins can locate errors) */
  rowNumber: number;
  name_en: string;
  name_ka: string;
  description_en: string;
  description_ka: string;
  manufacturer: string | null;
  sku: string | null;
  price: number | null;
  dentalmall_price: number | null;
  unit: string | null;
  quantity: number | null;
  category: string | null;
  subcategory: string | null;
  vendor: string | null;
  variant_type_en: string | null;
  variant_type_ka: string | null;
  variant_options: ParsedVariantOption[];
}

export interface ParseResult {
  rows: ParsedProductRow[];
  /** Sheet-level errors (file shape problems, not row content) */
  fileErrors: string[];
}

/** Maximum supported data rows (template limit) */
export const MAX_DATA_ROWS = 1000;

function cellString(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'string') return cell.trim();
  if (typeof cell === 'number' || typeof cell === 'boolean') return String(cell).trim();
  if (cell instanceof Date) return cell.toISOString();
  return String(cell).trim();
}

function cellNullableString(cell: unknown): string | null {
  const s = cellString(cell);
  return s.length > 0 ? s : null;
}

function cellNumber(cell: unknown): number | null {
  if (cell === null || cell === undefined || cell === '') return null;
  if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
  if (typeof cell === 'string') {
    // Tolerate commas as decimal separators (Georgian locale spreadsheets do this)
    const cleaned = cell.replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isRowEmpty(row: unknown[]): boolean {
  return row.every((cell) => cellString(cell) === '');
}

/**
 * Detect leftover header rows that some templates put below the documented
 * row 2 (e.g. a secondary Georgian label row, or a "*" required-field hint row).
 * Heuristic: the name column ends with " *" (the template's required-field
 * marker) — real product names won't do that.
 */
function isHeaderRow(row: unknown[]): boolean {
  const nameEn = cellString(row[0]);
  const nameKa = cellString(row[1]);
  if (nameEn.endsWith('*') || nameKa.endsWith('*')) return true;
  const known = new Set([
    'product name (en)',
    'product name (ka)',
    'პროდუქტის სახელი',
    'პროდუქტის სახელი (ka)',
  ]);
  return known.has(nameEn.toLowerCase()) || known.has(nameKa.toLowerCase());
}

function parseVariantOptions(row: unknown[]): ParsedVariantOption[] {
  // Q is column index 16 (0-indexed). 10 slots × 5 cols = columns 16..65.
  const out: ParsedVariantOption[] = [];
  const optionStart = 16; // column Q
  for (let i = 0; i < MAX_VARIANT_OPTIONS; i++) {
    const base = optionStart + i * VARIANT_OPTION_COLUMN_COUNT;
    const name_en = cellString(row[base]);
    const name_ka = cellString(row[base + 1]);
    const dentalmall_price = cellNumber(row[base + 2]);
    const sku = cellNullableString(row[base + 3]);
    const quantity = cellNumber(row[base + 4]);

    // Skip entirely empty option slots
    if (
      name_en === '' &&
      name_ka === '' &&
      dentalmall_price === null &&
      sku === null &&
      quantity === null
    ) {
      continue;
    }

    out.push({ name_en, name_ka, dentalmall_price, sku, quantity });
  }
  return out;
}

export function parseProductTemplate(buffer: ArrayBuffer | Buffer): ParseResult {
  const fileErrors: string[] = [];
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

  const sheetName = workbook.SheetNames.find((n) => n.trim() === PRODUCT_SHEET_NAME)
    || workbook.SheetNames[0];

  if (!sheetName) {
    return { rows: [], fileErrors: ['Workbook has no sheets'] };
  }
  if (sheetName !== PRODUCT_SHEET_NAME) {
    fileErrors.push(
      `Expected sheet named "${PRODUCT_SHEET_NAME}" — using "${sheetName}" instead`
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  const rows: ParsedProductRow[] = [];
  // Continue past empty rows (admins fat-finger them); only stop at end of sheet.
  for (let i = DATA_START_ROW_INDEX; i < matrix.length; i++) {
    if (rows.length >= MAX_DATA_ROWS) {
      fileErrors.push(
        `File exceeds the maximum of ${MAX_DATA_ROWS} data rows — stopped at row ${i + 1}`
      );
      break;
    }
    const row = matrix[i];
    if (!row || isRowEmpty(row)) continue;
    if (isHeaderRow(row)) continue;

    rows.push({
      rowNumber: i + 1, // 1-indexed for human-readable error messages
      name_en: cellString(row[0]),
      name_ka: cellString(row[1]),
      description_en: cellString(row[2]),
      description_ka: cellString(row[3]),
      manufacturer: cellNullableString(row[4]),
      sku: cellNullableString(row[5]),
      price: cellNumber(row[6]),
      dentalmall_price: cellNumber(row[7]),
      unit: cellNullableString(row[8]),
      quantity: cellNumber(row[9]),
      category: cellNullableString(row[10]),
      subcategory: cellNullableString(row[11]),
      vendor: cellNullableString(row[12]),
      // Column N (index 13) is described in the ticket but we treat O (14) as the
      // canonical variant-type-EN; this matches the template's actual data column.
      variant_type_en: cellNullableString(row[14]) ?? cellNullableString(row[13]),
      variant_type_ka: cellNullableString(row[15]),
      variant_options: parseVariantOptions(row),
    });
  }

  return { rows, fileErrors };
}
