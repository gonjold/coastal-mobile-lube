import Image from 'next/image';
import { BRAND_LOGOS, BRAND_NAME } from '@/lib/brand/logos';

type LogoVariant = 'primary' | 'white' | 'png';

interface BrandLogoProps {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

const VARIANT_MAP: Record<LogoVariant, string> = {
  primary: BRAND_LOGOS.primary,
  white: BRAND_LOGOS.white,
  png: BRAND_LOGOS.primaryPng,
};

export function BrandLogo({
  variant = 'primary',
  width = 200,
  height = 80,
  className,
  priority = false,
  alt = BRAND_NAME,
}: BrandLogoProps) {
  return (
    <Image
      src={VARIANT_MAP[variant]}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
