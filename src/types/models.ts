export type Role = 'USER' | 'ADMIN' | 'CLINIC' | 'VENDOR' | 'ACCOUNTANT' | 'STORAGE';

export type ClinicRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type VendorRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AuthProvider = 'EMAIL' | 'GOOGLE';

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_id: string | null;
  phone_number: string | null;
  auth_provider: AuthProvider;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductRequestStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

/** One row of the admin "requested products" table. */
export interface ProductRequestItem {
  id: string;
  request_id: string;
  name: string;
  invoice_name: string | null;
  description: string;
  estimated_price: string;
  store: string;
  photo_url: string | null;
  quantity: string;
  status: ProductRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  request: {
    user: Pick<User, 'id' | 'first_name' | 'last_name' | 'email' | 'phone_number'>;
  };
}

export interface Clinic {
  id: string;
  user_id: string;
  clinic_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicRequest {
  id: string;
  user_id: string;
  clinic_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  status: ClinicRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
  };
}

export interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  logo: string | null;
  is_active: boolean;
  /** false = the store sits in the buffer and is hidden from the public site */
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorRequest {
  id: string;
  user_id: string;
  company_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  status: VendorRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
  };
}

export interface Category {
  id: string;
  name: string;
  name_ka: string;
  slug: string;
  image: string | null;
  parent_id: string | null;
  parent?: Category;
  children?: Category[];
  products?: Product[];
  _count?: { products: number };
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  url: string;
  filename: string;
  original_name: string;
  type: string;
  size: number | null;
  product_id: string | null;
  /** Tagged to a variant option — the detail page slides to it when that option is picked */
  variant_option_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VariantOption {
  id: string;
  variant_type_id: string;
  name: string;
  name_ka: string;
  sku: string;
  /** Selling price — what the customer pays */
  price: string;
  /** Cost price — admin/vendor only, stripped from public responses */
  dentalmall_price: string;
  sale_price: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface VariantType {
  id: string;
  product_id: string;
  name: string;
  name_ka: string;
  options: VariantOption[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  name_ka: string;
  description: string | null;
  description_ka: string | null;
  manufacturer: string | null;
  /** Selling price — what the customer pays */
  price: string;
  /** Cost price — admin/vendor only, stripped from public responses */
  dentalmall_price: string | null;
  sale_price: string | null;
  discount_percent: number | null;
  /** Sales unit as supplied — "ცალი", "შეკვრა", "ნაკრები"… free text */
  unit: string | null;
  sku: string;
  stock: number;
  in_storage_stock: boolean;
  category_id: string;
  category?: Category;
  vendor_id: string | null;
  vendor?: Vendor;
  media?: Media[];
  variant_types?: VariantType[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'PENDING' | 'AWAITING_ADMIN_CONFIRMATION' | 'CONFIRMED_PENDING_PAYMENT' | 'CANCELLED_UNAVAILABLE' | 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_DELIVERY' | 'OUT_FOR_DELIVERY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'INVOICE_SENT' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_group_id: string | null;
  user_id: string;
  user?: OrderUser;
  address_id: string;
  address?: Address;
  status: OrderStatus;
  cancellation_reason: string | null;
  payment_status: PaymentStatus;
  payment_method: string;
  subtotal: string;
  discount: string;
  delivery_fee: string;
  service_fee: string;
  total: string;
  notes: string | null;
  invoice_url: string | null;
  payment_verified_by: string | null;
  payment_verified_at: string | null;
  payment_notes: string | null;
  prepared_by: string | null;
  prepared_at: string | null;
  shipped_by: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  warehouse_notes: string | null;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CheckoutOrderData {
  addressId: string;
  address: Address | null;
  paymentMethod: string;
  notes: string;
}

// Returned by POST /api/orders for each created order (one, or a split pair).
export interface PlacedOrderSummary {
  id: string;
  order_number: string;
  type: 'in_stock' | 'special_order';
  status: OrderStatus;
  total: number;
  item_count: number;
  invoice_url?: string | null;
}

export interface PlaceOrderResponse {
  split: boolean;
  order_group_id: string | null;
  orders: PlacedOrderSummary[];
  order_number: string;
  id: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  variant_option_id: string | null;
  variant_option?: VariantOption;
  variant_name: string | null;
  quantity: number;
  price: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Facet options for the shop filter sidebar (GET /api/products/facets).
export interface ProductFacets {
  manufacturers: { value: string; count: number }[];
  vendors: { id: string; name: string; count: number }[];
  priceMin: number;
  priceMax: number;
}

// Shape returned by the public GET /api/products (pagination is nested).
export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CartProduct {
  id: string;
  name: string;
  name_ka: string;
  price: string;
  sale_price: string | null;
  discount_percent: number | null;
  media?: Media[];
  manufacturer: string | null;
  stock: number;
  in_storage_stock: boolean;
  variant_types?: VariantType[];
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_option_id: string | null;
  variant_option?: VariantOption;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: CartProduct;
}

export interface Address {
  id: string;
  user_id: string;
  recipient_name: string;
  mobile_number: string;
  city: string;
  address: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Order status email types
export interface OrderStatusEmailData {
  orderNumber: string;
  customerName: string;
  changedField: 'status' | 'payment_status';
  newStatus: string;
  invoiceUrl: string | null;
  /** Optional extra note shown to the customer (e.g. a cancellation reason). */
  note?: string | null;
}

// Invoice types for email
export interface InvoiceOrderItem {
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  address: {
    recipient_name: string;
    mobile_number: string;
    city: string;
    address: string;
    postal_code?: string | null;
  };
  items: InvoiceOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  orderDate: string;
  paymentMethod: string;
}

// AI shopping assistant (POST /api/assistant). Prices come from the database,
// never from the model: the lowest variant price when the product has variants.
export interface AssistantProduct {
  id: string;
  name_ka: string;
  name: string;
  /** What the customer pays (sale price when on sale). */
  price: number;
  /** Struck-through original price; null when not on sale or for variant products. */
  original_price: number | null;
  /** Variant prices differ: show "from {price}". */
  price_from: boolean;
  unit: string | null;
  availability: 'in_stock' | 'special_order' | 'out_of_stock';
  image_url: string | null;
}

export interface AssistantResponse {
  id: string;
  reply: string;
  products: AssistantProduct[];
}

// Favorites (GET /api/favorites). Only products the public may see are listed;
// a product of an unpublished store is left out until the store is republished.
export interface FavoriteProduct
  extends Pick<Product, 'id' | 'name' | 'name_ka' | 'price' | 'sale_price' | 'stock' | 'in_storage_stock'> {
  media: Media[];
  variant_types: VariantType[];
}

export interface FavoriteItem {
  id: string;
  product_id: string;
  notify_on_restock: boolean;
  created_at: string;
  product: FavoriteProduct;
}

// Purchased products (GET /api/purchased-products): what the customer has had
// delivered, one entry per product + variant, most bought first. Products of an
// unpublished store and in-storage products without stock are left out.
export interface PurchasedProduct
  extends Pick<Product, 'id' | 'name' | 'name_ka' | 'price' | 'sale_price' | 'stock' | 'in_storage_stock'> {
  category: Pick<Category, 'name' | 'name_ka'> | null;
  media: Media[];
  variant_types: VariantType[];
}

export interface PurchasedProductEntry {
  /** product_id + variant_option_id, unique across pages */
  key: string;
  product_id: string;
  /** The option bought. Null for a product without variants, or when that option was deleted since. */
  variant_option_id: string | null;
  /** Total quantity over the customer's delivered orders */
  total_quantity: number;
  last_delivered_at: string;
  product: PurchasedProduct;
}

export interface PurchasedProductsPage {
  items: PurchasedProductEntry[];
  /** Send back as ?cursor= for the next page. Null once the list has ended. */
  next_cursor: string | null;
}

// Result of adding every favorite to the cart at once. Partial by design: each
// product reports what happened to it.
export type FavoriteCartOutcome =
  | 'added'
  | 'already_in_cart' // quantity increased by one
  | 'needs_variant'
  | 'out_of_stock'
  | 'stock_limit' // the cart already holds all the stock there is
  | 'unavailable';

export interface FavoriteCartResult {
  product_id: string;
  name: string;
  name_ka: string;
  outcome: FavoriteCartOutcome;
}

// AI assistant look, set in admin (GET /api/assistant). Null text means "use the
// default wording from the messages file".
export interface AssistantAppearance {
  button_label_ka: string | null;
  button_label_en: string | null;
  welcome_title_ka: string | null;
  welcome_title_en: string | null;
  welcome_text_ka: string | null;
  welcome_text_en: string | null;
  examples_ka: string[];
  examples_en: string[];
  button_color: string | null;
  button_position: 'right' | 'left';
  show_on_mobile: boolean;
}

export interface AssistantPublicConfig {
  enabled: boolean;
  appearance: AssistantAppearance | null;
}
