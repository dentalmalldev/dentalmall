// Application constants
export const APP_NAME = 'DentalMall';

// API endpoints
export const API_ROUTES = {
  // Example: AUTH: '/api/auth',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  VENDORS: '/vendors',
  CATEGORIES: '/categories',
  CART: '/cart',
  PROFILE: '/profile',
} as const;

// Navigation items (now use translation keys)
export const NAV_ITEMS = [
  { translationKey: 'navigation.vendors', href: ROUTES.VENDORS },
  { translationKey: 'navigation.category', href: ROUTES.CATEGORIES },
  { translationKey: 'navigation.courses', href: ROUTES.VENDORS },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

// Bottom navigation items (mobile) - now use translation keys
export const BOTTOM_NAV_ITEMS = [
  { translationKey: 'navigation.home', href: ROUTES.HOME, icon: 'home' },
  { translationKey: 'navigation.category', href: ROUTES.CATEGORIES, icon: 'category' },
  { translationKey: 'navigation.cart', href: ROUTES.CART, icon: 'cart' },
  { translationKey: 'navigation.profile', href: ROUTES.PROFILE, icon: 'profile' },
] as const;

export type BottomNavItem = (typeof BOTTOM_NAV_ITEMS)[number];
