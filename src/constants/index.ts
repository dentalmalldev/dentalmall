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
  // Add more routes as needed
} as const;

// Navigation items
export const NAV_ITEMS = [
  { name: 'მომწოდებლები', href: ROUTES.VENDORS },
  { name: 'კატეგორია', href: ROUTES.VENDORS },
  { name: 'კურსები', href: ROUTES.VENDORS },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

// Bottom navigation items (mobile)
export const BOTTOM_NAV_ITEMS = [
  { name: 'მთავარი', href: ROUTES.HOME, icon: 'home' },
  { name: 'კატეგორია', href: ROUTES.VENDORS, icon: 'category' },
  { name: 'კალათა', href: '/cart', icon: 'cart' },
  { name: 'პროფილი', href: '/profile', icon: 'profile' },
] as const;

export type BottomNavItem = (typeof BOTTOM_NAV_ITEMS)[number];
