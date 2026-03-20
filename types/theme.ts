import type { TColors } from "../theme/colors";

export type TThemeMode = "dark" | "light" | "system";

export interface IThemeContext {
  colors: TColors;
  isDark: boolean;
  mode: TThemeMode;
  isArabic: boolean;
  setMode: (mode: TThemeMode) => void;
}
