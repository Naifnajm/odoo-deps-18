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
import { StatusBadge } from "../../../components/status-badge";
import { ScreenHeader } from "../../../components/screen-header";
import { ErrorFallback } from "../../../components/error-boundary";

export default function EmployeeProjectsIndex() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.user?.uid);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isRefetching, isError } = useProjects(
    uid ? [["user_id", "=", uid]] : []
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
          onPress={() => router.push(`/(employee)/projects/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>
              {completed}/{item.task_count} tasks
            </Text>
          </View>
          <ProgressRing progress={progress} size={40} strokeWidth={3} />
        </TouchableOpacity>
      );
    },
    [colors]
  );

  if (isError && !data) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="My Projects" />
        <ErrorFallback title="Unable to load projects" onRetry={handleRefresh} />
      </View>
    );
  }

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
        estimatedItemSize={72}
        emptyTitle="No projects"
        emptyMessage="You don't have any projects assigned."
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
});
