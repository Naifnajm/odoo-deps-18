export const COLORS = {
  dark: {
    background: "#080C14",
    card: "#0F1420",
    elevated: "#161C2D",
    gold: "#C9A84C",
    blue: "#3B6FE8",
    text: "#F0F4FF",
    textMuted: "#8892AA",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    border: "rgba(255,255,255,0.08)",
    inputBackground: "#0F1420",
    overlay: "rgba(0,0,0,0.6)",
    skeleton: "#161C2D",
    skeletonHighlight: "#1E2540",
    tabBar: "#0A0F1A",
    statusBar: "light",
  },
  light: {
    background: "#F5F7FA",
    card: "#FFFFFF",
    elevated: "#FFFFFF",
    gold: "#B8952F",
    blue: "#2B5FD8",
    text: "#0F1729",
    textMuted: "#64748B",
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    border: "rgba(0,0,0,0.08)",
    inputBackground: "#F0F2F5",
    overlay: "rgba(0,0,0,0.4)",
    skeleton: "#E2E8F0",
    skeletonHighlight: "#F1F5F9",
    tabBar: "#FFFFFF",
    statusBar: "dark",
  },
} as const;

export type TColorScheme = "dark" | "light";
export type TColors = (typeof COLORS)[TColorScheme];
export type TColorKey = keyof TColors;
