export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const ICON_SIZES = {
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
} as const;

export const HITSLOP = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

export type TSpacing = keyof typeof SPACING;
export type TRadius = keyof typeof RADIUS;
