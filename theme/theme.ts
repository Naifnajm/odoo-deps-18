import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { COLORS, type TColors, type TColorScheme } from "./colors";
import { SPACING, RADIUS } from "./spacing";
import { FONT_SIZES, LINE_HEIGHTS, getFontFamily, getMonoFont } from "./typography";
import { useThemeStore } from "../stores/theme-store";
import type { TThemeMode, IThemeContext } from "../types/theme";

export interface ITheme {
  colors: TColors;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  fontSizes: typeof FONT_SIZES;
  lineHeights: typeof LINE_HEIGHTS;
  isDark: boolean;
}

export const resolveColorScheme = (
  mode: TThemeMode,
  systemScheme: TColorScheme | null | undefined
): TColorScheme => {
  if (mode === "system") {
    return systemScheme === "light" ? "light" : "dark";
  }
  return mode;
};

export const buildTheme = (scheme: TColorScheme): ITheme => ({
  colors: COLORS[scheme],
  spacing: SPACING,
  radius: RADIUS,
  fontSizes: FONT_SIZES,
  lineHeights: LINE_HEIGHTS,
  isDark: scheme === "dark",
});

const ThemeContext = createContext<IThemeContext | null>(null);

export const ThemeProvider = ThemeContext.Provider;

export const useTheme = (): IThemeContext => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
};

export const useAppTheme = (): ITheme & { mode: TThemeMode } => {
  const mode = useThemeStore((s: any) => s.mode);
  const systemScheme = useColorScheme();
  const scheme = resolveColorScheme(mode, systemScheme);
  const theme = buildTheme(scheme);
  return { ...theme, mode };
};

export { COLORS, SPACING, RADIUS, FONT_SIZES, LINE_HEIGHTS, getFontFamily, getMonoFont };
