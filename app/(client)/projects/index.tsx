import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ListRenderItem } from "@shopify/flash-list";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import { useAuthStore } from "../../../stores/auth-store";
import { useProjects, type IProject } from "../../../hooks/use-projects";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { ProgressRing } from "../../../components/progress-ring";
import { ScreenHeader } from "../../../components/screen-header";

export default function ClientProjectsIndex() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const partnerId = useAuthStore((s) => s.user?.partnerId);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isRefetching } = useProjects(
    partnerId ? [["partner_id", "=", partnerId]] : []
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("project.project") });
  }, [queryClient]);

  const filtered = useMemo(() => {
    const records = data?.records ?? [];
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter((p) => p.name.toLowerCase().includes(q));
  }, [data?.records, searchQuery]);

  const renderItem: ListRenderItem<IProject> = useCallback(
    ({ item }) => {
      const completed = item.task_count - item.open_task_count;
      const progress = item.task_count > 0 ? (completed / item.task_count) * 100 : 0;

      return (
        <TouchableOpacity
          style={[styles.row, { borderColor: colors.border }]}
          onPress={() => router.push(`/(client)/projects/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              {completed}/{item.task_count} tasks completed
            </Text>
            {item.last_update_status && (
              <Text style={[styles.updateStatus, { color: colors.textMuted }]}>
                Status: {item.last_update_status}
              </Text>
            )}
          </View>
          <ProgressRing progress={progress} size={44} strokeWidth={3} />
        </TouchableOpacity>
      );
    },
    [colors]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="My Projects" subtitle={`${data?.records?.length ?? 0} projects`} />

      <View style={[styles.searchRow, { borderColor: colors.border }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search projects..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
      </View>

      <OdooList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={80}
        emptyTitle="No projects"
        emptyMessage="No projects found for your account."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },
  updateStatus: { fontSize: 11, marginTop: 2, fontStyle: "italic" },
});
