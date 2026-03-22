import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import { useOdooApps, ODOO_APP_CATEGORIES, type IOdooApp } from "../../hooks/use-odoo-apps";
import { odooRpc } from "../../services/odoo-rpc";
import { SkeletonLoader } from "../../components/skeleton-loader";

export default function AppsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category ?? null
  );

  const apps = useOdooApps();

  const filteredApps = useMemo(() => {
    let list = apps.data ?? [];

    if (selectedCategory) {
      list = list.filter((app: IOdooApp) => app.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (app: IOdooApp) =>
          app.name.toLowerCase().includes(q) ||
          app.technicalName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [apps.data, selectedCategory, search]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["odoo", "ir.module.module"] });
  }, [queryClient]);

  const openApp = useCallback((app: IOdooApp) => {
    const baseUrl = odooRpc.getBaseUrl();
    const url = `${baseUrl}/web#action=${app.menuId}`;
    router.push({
      pathname: "/(main)/webview",
      params: { url, title: app.name },
    } as never);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Apps</Text>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search apps..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: !selectedCategory ? colors.gold : colors.elevated,
                borderColor: !selectedCategory ? colors.gold : colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: !selectedCategory ? "#080C14" : colors.text },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {ODOO_APP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === cat.key ? colors.gold : colors.elevated,
                  borderColor:
                    selectedCategory === cat.key ? colors.gold : colors.border,
                },
              ]}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === cat.key ? null : cat.key
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color:
                      selectedCategory === cat.key ? "#080C14" : colors.text,
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Apps Grid */}
      <ScrollView
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={apps.isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {apps.isLoading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <SkeletonLoader
                key={i}
                width="30%"
                height={100}
                borderRadius={RADIUS.md}
              />
            ))}
          </View>
        ) : filteredApps.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {search ? "No apps found" : "No installed apps"}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredApps.map((app: IOdooApp) => (
              <TouchableOpacity
                key={app.id}
                style={[
                  styles.appCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => openApp(app)}
                activeOpacity={0.7}
              >
                <Text style={styles.appIcon}>{app.icon}</Text>
                <Text
                  style={[styles.appName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {app.name}
                </Text>
                <Text
                  style={[styles.appDesc, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {app.technicalName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.base,
    fontSize: 15,
  },
  categoryScroll: { maxHeight: 36 },
  categoryScrollContent: { gap: SPACING.sm },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  categoryChipIcon: { fontSize: 14 },
  categoryChipText: { fontSize: 13, fontWeight: "600" },

  gridContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  appCard: {
    width: "30%",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.xs,
  },
  appIcon: { fontSize: 32 },
  appName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  appDesc: { fontSize: 10, textAlign: "center" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 16 },
});
