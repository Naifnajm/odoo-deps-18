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
import { useMyTasks, type IEmployeeTask } from "../../../hooks/use-employee";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { StatusBadge } from "../../../components/status-badge";
import { ProgressRing } from "../../../components/progress-ring";
import { ScreenHeader } from "../../../components/screen-header";
import { ErrorFallback } from "../../../components/error-boundary";

type TFilter = "all" | "open" | "done" | "blocked";

export default function TasksIndex() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<TFilter>("all");

  const { data, isLoading, isRefetching, isError } = useMyTasks();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("project.task") });
  }, [queryClient]);

  const filtered = useMemo(() => {
    let records = data?.records ?? [];

    if (filter === "open") records = records.filter((t) => t.kanban_state !== "done");
    else if (filter === "done") records = records.filter((t) => t.kanban_state === "done");
    else if (filter === "blocked") records = records.filter((t) => t.kanban_state === "blocked");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.project_id[1].toLowerCase().includes(q)
      );
    }

    return records;
  }, [data?.records, filter, searchQuery]);

  const renderItem: ListRenderItem<IEmployeeTask> = useCallback(
    ({ item }) => <TaskRow task={item} />,
    []
  );

  if (isError && !data) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="My Tasks" />
        <ErrorFallback title="Unable to load tasks" onRetry={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="My Tasks"
        subtitle={`${data?.records?.length ?? 0} tasks`}
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
          placeholder="Search tasks..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
      </View>

      <View style={[styles.filterRow, { borderColor: colors.border }]}>
        {(["all", "open", "done", "blocked"] as TFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              { backgroundColor: filter === f ? colors.gold : colors.elevated },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#080C14" : colors.textMuted },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <OdooList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={80}
        emptyTitle="No tasks"
        emptyMessage="No tasks match your current filter."
      />
    </View>
  );
}

function TaskRow({ task }: { task: IEmployeeTask }) {
  const { colors } = useTheme();

  const kanbanVariant =
    task.kanban_state === "done"
      ? "success"
      : task.kanban_state === "blocked"
        ? "danger"
        : "info";
  const kanbanLabel =
    task.kanban_state === "done"
      ? "Done"
      : task.kanban_state === "blocked"
        ? "Blocked"
        : "In Progress";

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={() => router.push(`/(employee)/tasks/${task.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {task.name}
        </Text>
        <Text style={[styles.rowProject, { color: colors.textMuted }]} numberOfLines={1}>
          {task.project_id[1]}
        </Text>
        <View style={styles.rowMeta}>
          <StatusBadge label={kanbanLabel} variant={kanbanVariant} size="sm" />
          {task.priority === "1" && (
            <StatusBadge label="Urgent" variant="danger" size="sm" />
          )}
          {task.date_deadline && (
            <Text style={[styles.deadline, { color: colors.textMuted }]}>
              {formatDeadline(task.date_deadline)}
            </Text>
          )}
        </View>
      </View>

      {task.planned_hours > 0 && (
        <ProgressRing progress={task.progress} size={40} strokeWidth={3} />
      )}
    </TouchableOpacity>
  );
}

function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `${diffDays}d`;
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  filterText: { fontSize: 12, fontWeight: "600" },
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
  rowProject: { fontSize: 12, marginTop: 2 },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  deadline: { fontSize: 11, fontWeight: "600" },
});
