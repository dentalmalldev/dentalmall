import {
  MAX_DESCRIPTION_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
  ProductRequestItemInput,
  productRequestItemZodSchema,
} from '@/lib/validations/product-request';

/** A product as the form holds it: every field is what the user typed so far. */
export interface ProductRow {
  id: string;
  name: string;
  invoice_name: string;
  description: string;
  estimated_price: string;
  store: string;
  quantity: string;
  photo_url: string | null;
}

export type ProductField = keyof ProductRequestItemInput;

/** Field → translation key of what's wrong with it. */
export type RowErrors = Partial<Record<ProductField, string>>;

export type TextField = 'name' | 'invoice_name' | 'description' | 'estimated_price' | 'store' | 'quantity';

export const TEXT_FIELD_LIMITS: Record<TextField, number> = {
  name: MAX_SHORT_TEXT_LENGTH,
  invoice_name: MAX_SHORT_TEXT_LENGTH,
  description: MAX_DESCRIPTION_LENGTH,
  estimated_price: MAX_SHORT_TEXT_LENGTH,
  store: MAX_SHORT_TEXT_LENGTH,
  quantity: MAX_SHORT_TEXT_LENGTH,
};

export const REQUIRED_FIELDS: ProductField[] = ['name', 'description', 'estimated_price', 'store', 'quantity'];

/** The desktop grid starts with this many rows and grows by the same step. */
export const ROWS_STEP = 10;

export function createRow(): ProductRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    invoice_name: '',
    description: '',
    estimated_price: '',
    store: '',
    quantity: '',
    photo_url: null,
  };
}

export function createRows(count: number): ProductRow[] {
  return Array.from({ length: count }, createRow);
}

export function isEmptyRow(row: ProductRow): boolean {
  return (
    !row.name.trim() &&
    !row.invoice_name.trim() &&
    !row.description.trim() &&
    !row.estimated_price.trim() &&
    !row.store.trim() &&
    !row.quantity.trim() &&
    !row.photo_url
  );
}

function toUncheckedInput(row: ProductRow) {
  return {
    name: row.name,
    invoice_name: row.invoice_name || null,
    description: row.description,
    estimated_price: row.estimated_price,
    store: row.store,
    photo_url: row.photo_url,
    quantity: row.quantity,
  };
}

export function toItemInput(row: ProductRow): ProductRequestItemInput {
  return productRequestItemZodSchema.parse(toUncheckedInput(row));
}

export function validateRow(row: ProductRow): RowErrors {
  const result = productRequestItemZodSchema.safeParse(toUncheckedInput(row));
  if (result.success) return {};

  const errors: RowErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ProductField;
    errors[field] ??= issue.message;
  }
  return errors;
}

/* ---------------- DRAFT ---------------- */

// Storage can throw or be missing (private windows, blocked site data). The form
// must keep working then, just without a draft, so every access is guarded.

/** Per user, so a shared computer doesn't show one customer another's products. */
const draftKey = (uid: string) => `product-request-draft:${uid}`;

export function loadDraft(uid: string): ProductRow[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(draftKey(uid)) ?? '[]');
    if (!Array.isArray(saved)) return [];

    return saved.map((value: Partial<ProductRow>) => {
      const text = (field: TextField) =>
        typeof value?.[field] === 'string' ? (value[field] as string) : '';

      return {
        ...createRow(),
        name: text('name'),
        invoice_name: text('invoice_name'),
        description: text('description'),
        estimated_price: text('estimated_price'),
        store: text('store'),
        quantity: text('quantity'),
        photo_url: typeof value?.photo_url === 'string' ? value.photo_url : null,
      };
    });
  } catch {
    return [];
  }
}

export function saveDraft(uid: string, rows: ProductRow[]): void {
  try {
    const entered = rows.filter((row) => !isEmptyRow(row));
    if (entered.length > 0) {
      localStorage.setItem(draftKey(uid), JSON.stringify(entered));
    } else {
      localStorage.removeItem(draftKey(uid));
    }
  } catch {
    // No draft this time. Nothing the user needs to act on.
  }
}

export function clearDraft(uid: string): void {
  try {
    localStorage.removeItem(draftKey(uid));
  } catch {
    // Same as above.
  }
}
