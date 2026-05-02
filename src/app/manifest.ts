import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DentalMall',
    short_name: 'DentalMall',
    description: 'Dental products online store — equipment, materials, and supplies for clinics and professionals.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#5B6ECD',
    icons: [
      {
        src: '/logos/logo-icon.png',
        sizes: '230x268',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logos/logo-vertical.png',
        sizes: '293x313',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
