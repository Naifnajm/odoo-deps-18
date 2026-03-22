import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import { useAuthStore } from "../../stores/auth-store";
import { useThemeStore } from "../../stores/theme-store";
import { useLanguageStore } from "../../stores/language-store";
import { ScreenHeader } from "../../components/screen-header";
import { odooRpc } from "../../services/odoo-rpc";
import type { TThemeMode } from "../../types/theme";

export default function SettingsScreen() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s: any) => s.user);
  const logout = useAuthStore((s: any) => s.logout);
  const setThemeMode = useThemeStore((s: any) => s.setMode);
  const language = useLanguageStore((s: any) => s.language);
  const setLanguage = useLanguageStore((s: any) => s.setLanguage);

  const handleLogout = useCallback(() => {
    if (Platform.OS === "web") {
      logout().then(() => router.replace("/(auth)/login" as never));
      return;
    }
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () =>
          logout().then(() => router.replace("/(auth)/login" as never)),
      },
    ]);
  }, [logout]);

  const handleThemeChange = useCallback(
    (newMode: TThemeMode) => {
      setThemeMode(newMode);
    },
    [setThemeMode]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ar" : "en");
  }, [language, setLanguage]);

  const openInWebView = useCallback(
    (path: string, title: string) => {
      const baseUrl = odooRpc.getBaseUrl();
      router.push({
        pathname: "/(main)/webview",
        params: { url: `${baseUrl}${path}`, title },
      } as never);
    },
    []
  );

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
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.profileAvatar}
              contentFit="cover"
            />
          ) : (
            <View
              style={[styles.profileAvatarPlaceholder, { backgroundColor: colors.gold }]}
            >
              <Text style={styles.profileAvatarLetter}>
                {(user?.name ?? "U")[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
              {user?.email}
            </Text>
            <Text style={[styles.profileCompany, { color: colors.textMuted }]}>
              {user?.companyName}
            </Text>
          </View>
        </View>

        {/* Odoo Settings Shortcuts */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Odoo Settings
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SettingsRow
            label="General Settings"
            colors={colors}
            onPress={() => openInWebView("/web#action=base_setup.action_general_configuration", "General Settings")}
          />
          <SettingsRow
            label="Users & Companies"
            colors={colors}
            onPress={() => openInWebView("/web#action=base.action_res_users", "Users")}
          />
          <SettingsRow
            label="My Profile"
            colors={colors}
            onPress={() => openInWebView(`/web#model=res.users&id=${user?.uid}&view_type=form`, "My Profile")}
            isLast
          />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {(["dark", "light", "system"] as TThemeMode[]).map((m, i) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.themeRow,
                {
                  borderColor: colors.border,
                  borderBottomWidth: i === 2 ? 0 : 1,
                },
              ]}
              onPress={() => handleThemeChange(m)}
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

        {/* Language */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Language
        </Text>
        <TouchableOpacity
          style={[
            styles.langCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={[styles.langLabel, { color: colors.text }]}>
            {language === "en" ? "English" : "العربية"}
          </Text>
          <Text style={[styles.langSwitch, { color: colors.gold }]}>
            Switch to {language === "en" ? "العربية" : "English"}
          </Text>
        </TouchableOpacity>

        {/* Account Info */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account
        </Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <InfoRow
            label="Server"
            value={odooRpc.getBaseUrl()}
            colors={colors}
          />
          <InfoRow label="Login" value={user?.login ?? ""} colors={colors} />
          <InfoRow label="Role" value={user?.role ?? ""} colors={colors} />
          <InfoRow
            label="Language"
            value={user?.lang ?? ""}
            colors={colors}
          />
          <InfoRow
            label="Timezone"
            value={user?.tz ?? ""}
            colors={colors}
          />
          <InfoRow
            label="Version"
            value={user?.serverVersion ?? ""}
            colors={colors}
            isLast
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.danger }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  label,
  colors,
  onPress,
  isLast = false,
}: {
  label: string;
  colors: Record<string, string>;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.settingsRow,
        { borderColor: colors.border, borderBottomWidth: isLast ? 0 : 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.settingsRowLabel, { color: colors.text }]}>
        {label}
      </Text>
      <Text style={[styles.settingsRowArrow, { color: colors.textMuted }]}>
        {"\u203A"}
      </Text>
    </TouchableOpacity>
  );
}

function InfoRow({
  label,
  value,
  colors,
  isLast = false,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        { borderColor: colors.border, borderBottomWidth: isLast ? 0 : 1 },
      ]}
    >
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[styles.infoValue, { color: colors.text }]}
        numberOfLines={1}
      >
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
  profileAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarLetter: { fontSize: 24, fontWeight: "700", color: "#080C14" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileCompany: { fontSize: 12, marginTop: 1 },

  sectionTitle: {
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

  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.base,
    borderBottomWidth: 1,
  },
  settingsRowLabel: { fontSize: 15, fontWeight: "500" },
  settingsRowArrow: { fontSize: 22 },

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

  langCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  langLabel: { fontSize: 15, fontWeight: "600" },
  langSwitch: { fontSize: 13, fontWeight: "600" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: SPACING.base,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "600", maxWidth: "60%" },

  logoutButton: {
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },
});
