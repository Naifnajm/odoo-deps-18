import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import { useMyTaskDetail, useUpdateMyTask } from "../../../hooks/use-employee";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { ProgressRing } from "../../../components/progress-ring";
import { KPICard } from "../../../components/kpi-card";
import { SkeletonGroup } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id) || 0;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: task, isLoading, isError, refetch } = useMyTaskDetail(taskId);
  const updateTask = useUpdateMyTask();

  const handleChangeState = useCallback(() => {
    if (!task) return;
    Alert.alert("Update Status", undefined, [
      {
        text: "In Progress",
        onPress: () => updateTask.mutate({ ids: [taskId], values: { kanban_state: "normal" } }),
      },
      {
        text: "Done",
        onPress: () => updateTask.mutate({ ids: [taskId], values: { kanban_state: "done" } }),
      },
      {
        text: "Blocked",
        onPress: () => updateTask.mutate({ ids: [taskId], values: { kanban_state: "blocked" } }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [task, taskId, updateTask]);

  if (isError && !task) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Task" showBack />
        <ErrorFallback title="Task not found" onRetry={() => refetch()} />
      </View>
    );
  }

  if (isLoading || !task) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Loading..." showBack />
        <SkeletonGroup count={5} style={{ padding: SPACING.xl }} />
      </View>
    );
  }

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

  const hasTimeTracking = task.planned_hours > 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={task.name}
        subtitle={task.project_id[1]}
        showBack
        rightAction={
          <TouchableOpacity onPress={handleChangeState} activeOpacity={0.7}>
            <Text style={[styles.actionText, { color: colors.gold }]}>Status</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badges */}
        <View style={styles.badgeRow}>
          <TouchableOpacity onPress={handleChangeState} activeOpacity={0.7}>
            <StatusBadge label={kanbanLabel} variant={kanbanVariant} />
          </TouchableOpacity>
          <StatusBadge label={task.stage_id[1]} variant="gold" />
          {task.priority === "1" && (
            <StatusBadge label="Urgent" variant="danger" />
          )}
        </View>

        {/* Time tracking */}
        {hasTimeTracking && (
          <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ProgressRing progress={task.progress} size={64} strokeWidth={5} />
            <View style={styles.timeInfo}>
              <Text style={[styles.timeLabel, { color: colors.text }]}>
                {task.effective_hours.toFixed(1)}h / {task.planned_hours.toFixed(1)}h
              </Text>
              <Text style={[styles.timeSub, { color: colors.textMuted }]}>
                {task.remaining_hours > 0
                  ? `${task.remaining_hours.toFixed(1)}h remaining`
                  : "Completed"}
              </Text>
            </View>
          </View>
        )}

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KPICard
            label="Hours Logged"
            value={Math.round(task.effective_hours * 10) / 10}
            suffix="h"
            style={styles.kpiCard}
          />
          <KPICard
            label="Subtasks"
            value={task.child_ids.length}
            style={styles.kpiCard}
          />
        </View>

        {/* Info Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <InfoRow label="Project" value={task.project_id[1]} colors={colors} />
          <InfoRow label="Stage" value={task.stage_id[1]} colors={colors} />
          {task.date_deadline && (
            <InfoRow label="Deadline" value={formatDate(task.date_deadline)} colors={colors} />
          )}
          {task.user_ids.length > 0 && (
            <InfoRow
              label="Assigned To"
              value={task.user_ids.map((u: [number, string]) => u[1]).join(", ")}
              colors={colors}
            />
          )}
          <InfoRow label="Created" value={formatDate(task.create_date)} colors={colors} />
          <InfoRow label="Updated" value={formatDate(task.write_date)} colors={colors} />
          {task.parent_id && (
            <InfoRow label="Parent Task" value={task.parent_id[1]} colors={colors} />
          )}
        </View>

        {/* Description */}
        {task.description && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              {stripHtml(task.description)}
            </Text>
          </View>
        )}

        {/* Quick action: Mark done */}
        {task.kanban_state !== "done" && (
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.success }]}
            onPress={() =>
              updateTask.mutate(
                { ids: [taskId], values: { kanban_state: "done" } },
                { onSuccess: () => refetch() }
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.doneText}>Mark as Done</Text>
          </TouchableOpacity>
        )}
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
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },
  actionText: { fontSize: 14, fontWeight: "700" },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },

  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  timeInfo: { flex: 1 },
  timeLabel: { fontSize: 16, fontWeight: "700" },
  timeSub: { fontSize: 13, marginTop: 2 },

  kpiRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  kpiCard: { flex: 1 },

  section: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: SPACING.md },
  descText: { fontSize: 14, lineHeight: 20 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  infoLabel: { fontSize: 13, fontWeight: "500", width: 100 },
  infoValue: { fontSize: 14, fontWeight: "600", flex: 1, textAlign: "right" },

  doneButton: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  doneText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
