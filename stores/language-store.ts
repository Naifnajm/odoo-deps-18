import { create } from "zustand";
import { I18nManager } from "react-native";
import { cacheStorage } from "../utils/storage";

const LANG_CACHE_KEY = "app:language";

type TLanguage = "en" | "ar";

interface ILanguageState {
  language: TLanguage;
  isArabic: boolean;
  isRTL: boolean;
  setLanguage: (lang: TLanguage) => void;
  initialize: () => void;
}

export const useLanguageStore = create<ILanguageState>((set: any) => ({
  language: "en",
  isArabic: false,
  isRTL: false,

  setLanguage: (lang: TLanguage) => {
    const isArabic = lang === "ar";
    const isRTL = isArabic;

    // Persist choice
    cacheStorage.set(LANG_CACHE_KEY, lang);

    // Force RTL for Arabic
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }

    set({ language: lang, isArabic, isRTL });
  },

  initialize: () => {
    const cached = cacheStorage.get<TLanguage>(LANG_CACHE_KEY);
    const lang = cached ?? "en";
    const isArabic = lang === "ar";
    const isRTL = isArabic;

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }

    set({ language: lang, isArabic, isRTL });
  },
}));
