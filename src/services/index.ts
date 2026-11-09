// API services
export { api } from './api';
export { categoriesService } from './categories';
export { productsService } from './products';
export { authService, BackOfficeAccessDeniedError } from './auth';
export type { RegisterData, LoginData, DbUser, BackOfficeRole } from './auth';
export { cartService, CartRequestError, isInsufficientStockError } from './cart';
export { favoritesService } from './favorites';
export { purchasedProductsService } from './purchasedProducts';
export { productRequestsService } from './productRequests';
export type { CreateProductRequestData } from './productRequests';
export { ordersService } from './orders';
export { vendorService } from './vendor';
export type { VendorDashboardStats, VendorProductPricingUpdate } from './vendor';
