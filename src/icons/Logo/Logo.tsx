import Image from 'next/image';

export type LogoVariant = 'icon' | 'vertical' | 'horizontal';

export interface LogoProps {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  className?: string;
}

const logoConfig = {
  icon: {
    src: '/logos/logo-icon.png',
    defaultWidth: 230,
    defaultHeight: 268,
    alt: 'DentalMall',
  },
  vertical: {
    src: '/logos/logo-vertical.png',
    defaultWidth: 293,
    defaultHeight: 313,
    alt: 'DentalMall',
  },
  horizontal: {
    src: '/logos/logo-horizontal.png',
    defaultWidth: 463,
    defaultHeight: 84,
    alt: 'DentalMall',
  },
} as const;

export function Logo({ variant = 'icon', width, height, className }: LogoProps) {
  const config = logoConfig[variant];

  return (
    <Image
      src={config.src}
      alt={config.alt}
      width={width ?? config.defaultWidth}
      height={height ?? config.defaultHeight}
      className={className}
      priority
      style={{
        objectFit: 'cover'
      }}
    />
  );
}
