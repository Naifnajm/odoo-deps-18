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
import { useProjects, type IProject } from "../../../hooks/use-projects";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { StatusBadge } from "../../../components/status-badge";
import { ProgressRing } from "../../../components/progress-ring";
import { ScreenHeader } from "../../../components/screen-header";
import { ErrorFallback } from "../../../components/error-boundary";

export default function AdminProjectsIndex() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isRefetching, isError, refetch } = useProjects();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("project.project") });
  }, [queryClient]);

  const filteredProjects = useMemo(() => {
    const records = data?.records ?? [];
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.partner_id && p.partner_id[1].toLowerCase().includes(q))
    );
  }, [data?.records, searchQuery]);

  const renderItem: ListRenderItem<IProject> = useCallback(
    ({ item }) => <ProjectRow project={item} />,
    []
  );

  if (isError && !data) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Projects" />
        <ErrorFallback title="Unable to load projects" onRetry={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Projects"
        subtitle={`${data?.records?.length ?? 0} projects`}
      />

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
        data={filteredProjects}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={88}
        emptyTitle="No projects"
        emptyMessage="No projects found matching your search."
      />
    </View>
  );
}

function ProjectRow({ project }: { project: IProject }) {
  const { colors } = useTheme();

  const completedTasks = project.task_count - project.open_task_count;
  const progress = project.task_count > 0
    ? (completedTasks / project.task_count) * 100
    : 0;

  const statusVariant = getStatusVariant(project.last_update_status);
  const statusLabel = getStatusLabel(project.last_update_status);

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={() => router.push(`/(admin)/projects/${project.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {project.is_favorite ? "\u2605 " : ""}{project.name}
          </Text>
        </View>
        {project.partner_id && (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {project.partner_id[1]}
          </Text>
        )}
        <View style={styles.rowMeta}>
          <Text style={[styles.taskCount, { color: colors.textMuted }]}>
            {completedTasks}/{project.task_count} tasks
          </Text>
          {statusLabel && (
            <StatusBadge label={statusLabel} variant={statusVariant} size="sm" />
          )}
        </View>
      </View>

      <ProgressRing
        progress={progress}
        size={44}
        strokeWidth={4}
        showLabel
      />
    </TouchableOpacity>
  );
}

function getStatusVariant(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "on_track": return "success";
    case "at_risk": return "warning";
    case "off_track": return "danger";
    case "on_hold": return "info";
    default: return "neutral";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "on_track": return "On Track";
    case "at_risk": return "At Risk";
    case "off_track": return "Off Track";
    case "on_hold": return "On Hold";
    case "done": return "Done";
    default: return "";
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
  rowLeft: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  taskCount: {
    fontSize: 12,
    fontWeight: "500",
  },
});
