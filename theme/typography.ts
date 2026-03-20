import { Platform } from "react-native";

export const FONT_FAMILIES = {
  arabic: {
    regular: "Cairo_400Regular",
    semiBold: "Cairo_600SemiBold",
    bold: "Cairo_700Bold",
  },
  latin: {
    regular: "Sora_400Regular",
    semiBold: "Sora_600SemiBold",
    bold: "Sora_700Bold",
  },
  mono: "JetBrainsMono_400Regular",
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const LINE_HEIGHTS = {
  xs: 14,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "3xl": 38,
  "4xl": 44,
} as const;

export type TFontSize = keyof typeof FONT_SIZES;

export const getFontFamily = (
  weight: "regular" | "semiBold" | "bold",
  isArabic: boolean
): string => {
  if (isArabic) {
    return FONT_FAMILIES.arabic[weight];
  }
  return FONT_FAMILIES.latin[weight];
};

export const getMonoFont = (): string => {
  return FONT_FAMILIES.mono;
};

export const createTextStyle = (
  size: TFontSize,
  weight: "regular" | "semiBold" | "bold",
  isArabic: boolean
) => ({
  fontFamily: getFontFamily(weight, isArabic),
  fontSize: FONT_SIZES[size],
  lineHeight: LINE_HEIGHTS[size],
  ...(Platform.OS === "android" && isArabic ? { writingDirection: "rtl" as const } : {}),
});
