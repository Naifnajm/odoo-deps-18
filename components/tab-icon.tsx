import { Text, StyleSheet } from "react-native";

// Simple Unicode-based tab icons — no external dependency needed.
// Swap for @expo/vector-icons if installed.

const ICON_MAP: Record<string, string> = {
  // Main tabs
  home: "\u2302",        // ⌂
  apps: "\u25A0",        // ■
  notifications: "\u2709", // ✉
  settings: "\u2699",    // ⚙

  // Legacy tabs (kept for compatibility)
  dashboard: "\u25A0",   // ■
  crm: "\u2661",         // ♡
  projects: "\u2630",    // ☰
  invoices: "\u2709",    // ✉
  reports: "\u2637",     // ☷
  tasks: "\u2713",       // ✓
  hr: "\u263A",          // ☺
  support: "\u2706",     // ✆
  documents: "\u2637",   // ☷
  profile: "\u2603",     // ☃
};

interface TabIconProps {
  name: string;
  color: string;
  size?: number;
}

export function TabIcon({ name, color, size = 20 }: TabIconProps) {
  const icon = ICON_MAP[name] ?? "\u25CF"; // ● fallback
  return (
    <Text style={[styles.icon, { color, fontSize: size }]}>{icon}</Text>
  );
}

const styles = StyleSheet.create({
  icon: { textAlign: "center" },
});
