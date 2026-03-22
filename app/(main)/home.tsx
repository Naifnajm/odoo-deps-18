import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import { useAuthStore } from "../../stores/auth-store";
import { useOdooApps, ODOO_APP_CATEGORIES } from "../../hooks/use-odoo-apps";
import { useNotifications } from "../../hooks/use-notifications";
import { odooRpc } from "../../services/odoo-rpc";
import { SkeletonLoader } from "../../components/skeleton-loader";
import { QuickCreate } from "../../components/quick-create";
import { usePushNotifications } from "../../hooks/use-push-notifications";

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s: any) => s.user);
  const queryClient = useQueryClient();
  const [quickCreateVisible, setQuickCreateVisible] = useState(false);
  const apps = useOdooApps();
  const notifications = useNotifications();
  usePushNotifications();

  const isRefreshing = apps.isRefetching || notifications.isRefetching;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["odoo", "ir.module.module"] });
    queryClient.invalidateQueries({ queryKey: ["odoo", "mail.message"] });
  }, [queryClient]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const unreadCount = notifications.data?.length ?? 0;

  const favoriteApps = useMemo(() => {
    const allApps = apps.data ?? [];
    // Show first 6 apps as favorites for quick access
    return allApps.slice(0, 6);
  }, [apps.data]);

  const openApp = useCallback((menuId: number, appName: string) => {
    const baseUrl = odooRpc.getBaseUrl();
    const url = `${baseUrl}/web#action=${menuId}`;
    router.push({
      pathname: "/(main)/webview",
      params: { url, title: appName },
    } as never);
  }, []);

  const openFullOdoo = useCallback(() => {
    const baseUrl = odooRpc.getBaseUrl();
    router.push({
      pathname: "/(main)/webview",
      params: { url: `${baseUrl}/web`, title: "Odoo" },
    } as never);
  }, []);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + 80 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.gold}
          colors={[colors.gold]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>
            {greeting},
          </Text>
          <Text
            style={[styles.userName, { color: colors.text }]}
            numberOfLines={1}
          >
            {user?.name ?? "User"}
          </Text>
          {user?.companyName ? (
            <Text style={[styles.company, { color: colors.textMuted }]}>
              {user.companyName}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(main)/settings")}
          activeOpacity={0.7}
        >
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.gold }]}>
              <Text style={styles.avatarLetter}>
                {(user?.name ?? "U")[0].toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications Banner */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.notifBanner, { backgroundColor: colors.blue }]}
          onPress={() => router.push("/(main)/notifications")}
          activeOpacity={0.8}
        >
          <Text style={styles.notifText}>
            {unreadCount} new notification{unreadCount > 1 ? "s" : ""}
          </Text>
          <Text style={styles.notifArrow}>{"\u2192"}</Text>
        </TouchableOpacity>
      )}

      {/* Open Full Odoo */}
      <TouchableOpacity
        style={[styles.fullOdooCard, { backgroundColor: colors.gold }]}
        onPress={openFullOdoo}
        activeOpacity={0.8}
      >
        <View style={styles.fullOdooContent}>
          <Text style={styles.fullOdooTitle}>Open Odoo</Text>
          <Text style={styles.fullOdooSub}>
            Full access to all your apps and data
          </Text>
        </View>
        <Text style={styles.fullOdooArrow}>{"\u2192"}</Text>
      </TouchableOpacity>

      {/* Quick Apps */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Access
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(main)/apps")}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAll, { color: colors.gold }]}>All Apps</Text>
        </TouchableOpacity>
      </View>

      {apps.isLoading ? (
        <View style={styles.appsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonLoader
              key={i}
              width="30%"
              height={90}
              borderRadius={RADIUS.md}
            />
          ))}
        </View>
      ) : (
        <View style={styles.appsGrid}>
          {favoriteApps.map((app: any) => (
            <TouchableOpacity
              key={app.id}
              style={[
                styles.appCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => openApp(app.menuId, app.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.appIcon}>{app.icon}</Text>
              <Text
                style={[styles.appName, { color: colors.text }]}
                numberOfLines={1}
              >
                {app.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* App Categories */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.xl }]}>
        Browse by Category
      </Text>
      <View style={styles.categoriesGrid}>
        {ODOO_APP_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() =>
              router.push({
                pathname: "/(main)/apps",
                params: { category: cat.key },
              } as never)
            }
            activeOpacity={0.7}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* FAB - Quick Create */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.gold }]}
        onPress={() => setQuickCreateVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <QuickCreate
        visible={quickCreateVisible}
        onClose={() => setQuickCreateVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 14, fontWeight: "500" },
  userName: { fontSize: 22, fontWeight: "700", marginTop: 2 },
  company: { fontSize: 12, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { fontSize: 20, fontWeight: "700", color: "#080C14" },

  notifBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.base,
  },
  notifText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  notifArrow: { fontSize: 18, color: "#fff" },

  fullOdooCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  fullOdooContent: {},
  fullOdooTitle: { fontSize: 20, fontWeight: "700", color: "#080C14" },
  fullOdooSub: { fontSize: 13, color: "#080C14", opacity: 0.7, marginTop: 2 },
  fullOdooArrow: { fontSize: 24, color: "#080C14" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600" },

  appsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  appCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  appIcon: { fontSize: 28 },
  appName: { fontSize: 11, fontWeight: "600", textAlign: "center" },

  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  categoryCard: {
    width: "47%",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  categoryIcon: { fontSize: 24 },
  categoryName: { fontSize: 14, fontWeight: "600", flex: 1 },

  fab: {
    position: "absolute",
    bottom: 100,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { fontSize: 28, fontWeight: "600", color: "#080C14", marginTop: -2 },
});
