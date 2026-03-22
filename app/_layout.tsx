import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { StyleSheet } from "react-native";
import { queryClient } from "../services/query-client";
import { useAppTheme, ThemeProvider } from "../theme/theme";
import { NetworkBanner } from "../components/network-banner";
import { useThemeStore } from "../stores/theme-store";
import { useLanguageStore } from "../stores/language-store";

function AppInner() {
  const theme = useAppTheme();
  const setMode = useThemeStore((s: any) => s.setMode);
  const initLanguage = useLanguageStore((s: any) => s.initialize);
  const isArabic = useLanguageStore((s: any) => s.isArabic);

  useEffect(() => {
    initLanguage();
  }, [initLanguage]);

  const themeContext = {
    colors: theme.colors,
    isDark: theme.isDark,
    mode: theme.mode,
    isArabic,
    setMode,
  };

  return (
    <ThemeProvider value={themeContext}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <NetworkBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(main)" options={{ animation: "fade" }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
