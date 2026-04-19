/**
 * Canonical Coastal brand logo assets.
 * All variants derived from the primary SVG via Cloudinary transformations.
 * Never hardcode logo URLs elsewhere, always import from this file.
 */

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dgcdcqjrz/image/upload';
const LOGO_PUBLIC_ID = 'v1775916096/Coastal_logo_bh3biu';

export const BRAND_LOGOS = {
  primary: `${CLOUDINARY_BASE}/${LOGO_PUBLIC_ID}.svg`,
  primaryPng: `${CLOUDINARY_BASE}/f_png,w_1200,q_auto/${LOGO_PUBLIC_ID}.png`,
  white: `${CLOUDINARY_BASE}/e_grayscale,e_colorize:100,co_white/${LOGO_PUBLIC_ID}.png`,
  favicon192: `${CLOUDINARY_BASE}/w_192,h_192,c_pad,b_transparent,f_png/${LOGO_PUBLIC_ID}.png`,
  favicon512: `${CLOUDINARY_BASE}/w_512,h_512,c_pad,b_transparent,f_png/${LOGO_PUBLIC_ID}.png`,
  appleTouchIcon: `${CLOUDINARY_BASE}/w_180,h_180,c_pad,b_rgb:0B2040,f_png/${LOGO_PUBLIC_ID}.png`,
  ogImage: `${CLOUDINARY_BASE}/w_1200,h_630,c_pad,b_rgb:0B2040,f_jpg,q_auto/${LOGO_PUBLIC_ID}.jpg`,
} as const;

export const BRAND_NAME = 'Coastal Mobile Lube & Tire';
export const BRAND_TAGLINE = 'Automotive, Marine, Fleet';
