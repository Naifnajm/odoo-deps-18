import { create } from "zustand";
import type { TThemeMode } from "../types/theme";

interface IThemeState {
  mode: TThemeMode;
  setMode: (mode: TThemeMode) => void;
}

export const useThemeStore = create<IThemeState>((set: any) => ({
  mode: "dark" as TThemeMode,
  setMode: (mode: TThemeMode) => set({ mode }),
}));
