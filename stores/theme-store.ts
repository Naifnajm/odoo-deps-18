import { create } from "zustand";
import type { TThemeMode } from "../types/theme";

interface IThemeState {
  mode: TThemeMode;
  setMode: (mode: TThemeMode) => void;
}

export const useThemeStore = create<IThemeState>((set) => ({
  mode: "dark",
  setMode: (mode) => set({ mode }),
}));
