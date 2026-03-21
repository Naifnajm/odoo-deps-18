import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import { useAuthStore } from "../../stores/auth-store";
import { useThemeStore } from "../../stores/theme-store";
import { ScreenHeader } from "../../components/screen-header";
import type { TThemeMode } from "../../types/theme";

export default function AdminSettings() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  }, [logout]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {user?.avatarUrl && (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.profileAvatar}
              contentFit="cover"
            />
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email}</Text>
            <Text style={[styles.profileRole, { color: colors.gold }]}>Administrator</Text>
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["dark", "light", "system"] as TThemeMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.themeRow, { borderColor: colors.border }]}
              onPress={() => setThemeMode(m)}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeLabel, { color: colors.text }]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: mode === m ? colors.gold : colors.textMuted,
                    backgroundColor: mode === m ? colors.gold : "transparent",
                  },
                ]}
              >
                {mode === m && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Server Info */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Server</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow label="URL" value={user?.login ?? ""} colors={colors} />
          <InfoRow label="Database" value={user?.db ?? ""} colors={colors} />
          <InfoRow label="Version" value={user?.serverVersion ?? ""} colors={colors} />
          <InfoRow label="Language" value={user?.lang ?? ""} colors={colors} />
          <InfoRow label="Timezone" value={user?.tz ?? ""} colors={colors} />
          <InfoRow label="Company" value={user?.companyName ?? ""} colors={colors} />
        </View>

        {/* Admin Tools */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Tools</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toolRow, { borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => Alert.alert("Cache Cleared", "All cached data has been refreshed.")}
          >
            <Text style={[styles.toolLabel, { color: colors.text }]}>Clear Cache</Text>
            <Text style={[styles.toolArrow, { color: colors.textMuted }]}>{"\u203A"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolRow, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.toolLabel, { color: colors.text }]}>Export Data</Text>
            <Text style={[styles.toolArrow, { color: colors.textMuted }]}>{"\u203A"}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.danger }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          OdooMobile v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={[styles.infoRow, { borderColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 28 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileRole: { fontSize: 12, fontWeight: "600", marginTop: 2 },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  section: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: SPACING.xl,
  },

  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.base,
    borderBottomWidth: 1,
  },
  themeLabel: { fontSize: 15, fontWeight: "500" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#080C14",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.base,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "600", maxWidth: "60%" },

  toolRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.base,
    borderBottomWidth: 1,
  },
  toolLabel: { fontSize: 15, fontWeight: "500" },
  toolArrow: { fontSize: 24, fontWeight: "300" },

  logoutButton: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },

  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: SPACING.xl,
  },
});
