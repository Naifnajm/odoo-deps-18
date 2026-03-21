import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import {
  useProjectDetail,
  useProjectTasks,
  type IProjectTask,
} from "../../../hooks/use-projects";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { ProgressRing } from "../../../components/progress-ring";
import { KPICard } from "../../../components/kpi-card";
import { SkeletonGroup } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";

type TViewMode = "all" | "open" | "done";

export default function AdminProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Number(id) || 0;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<TViewMode>("all");

  const { data: project, isLoading, isError, refetch } = useProjectDetail(projectId);
  const tasks = useProjectTasks(projectId);

  const filteredTasks = useMemo(() => {
    const allTasks = tasks.data?.records ?? [];
    if (viewMode === "open") return allTasks.filter((t: IProjectTask) => t.kanban_state !== "done");
    if (viewMode === "done") return allTasks.filter((t: IProjectTask) => t.kanban_state === "done");
    return allTasks;
  }, [tasks.data?.records, viewMode]);

  const tasksByStage = useMemo(() => {
    const grouped: Record<string, IProjectTask[]> = {};
    for (const task of filteredTasks) {
      const stageName = task.stage_id[1];
      if (!grouped[stageName]) grouped[stageName] = [];
      grouped[stageName].push(task);
    }
    return grouped;
  }, [filteredTasks]);

  if (isError && !project) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Project" showBack />
        <ErrorFallback title="Project not found" onRetry={() => refetch()} />
      </View>
    );
  }

  if (isLoading || !project) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Loading..." showBack />
        <SkeletonGroup count={6} style={{ padding: SPACING.xl }} />
      </View>
    );
  }

  const completedTasks = project.task_count - project.open_task_count;
  const progress = project.task_count > 0
    ? (completedTasks / project.task_count) * 100
    : 0;

  const totalHours = (tasks.data?.records ?? []).reduce((s: number, t: IProjectTask) => s + t.effective_hours, 0);
  const plannedHours = (tasks.data?.records ?? []).reduce((s: number, t: IProjectTask) => s + t.planned_hours, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={project.name}
        subtitle={project.partner_id ? project.partner_id[1] : undefined}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ProgressRing progress={progress} size={64} strokeWidth={5} />
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                {completedTasks}/{project.task_count}
              </Text>
              <Text style={[styles.progressSub, { color: colors.textMuted }]}>
                tasks completed
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <KPICard
            label="Open Tasks"
            value={project.open_task_count}
            style={styles.kpiCard}
          />
          <KPICard
            label="Hours Logged"
            value={Math.round(totalHours)}
            suffix="h"
            style={styles.kpiCard}
          />
        </View>

        {plannedHours > 0 && (
          <View style={[styles.hoursBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.hoursInfo}>
              <Text style={[styles.hoursLabel, { color: colors.textMuted }]}>
                Time Progress
              </Text>
              <Text style={[styles.hoursValue, { color: colors.text }]}>
                {Math.round(totalHours)}h / {Math.round(plannedHours)}h
              </Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.elevated }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: totalHours > plannedHours ? colors.danger : colors.gold,
                    width: `${Math.min((totalHours / plannedHours) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Description */}
        {project.description && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              {stripHtml(project.description)}
            </Text>
          </View>
        )}

        {/* Ratings */}
        {project.rating_count > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Rating</Text>
            <View style={styles.ratingRow}>
              <Text style={[styles.ratingValue, { color: colors.gold }]}>
                {project.rating_avg.toFixed(1)}
              </Text>
              <Text style={[styles.ratingSub, { color: colors.textMuted }]}>
                / 5 ({project.rating_count} reviews)
              </Text>
            </View>
          </View>
        )}

        {/* Task Filter Tabs */}
        <View style={styles.filterRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
          <View style={styles.filterTabs}>
            {(["all", "open", "done"] as TViewMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: viewMode === mode ? colors.gold : colors.elevated,
                  },
                ]}
                onPress={() => setViewMode(mode)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: viewMode === mode ? "#080C14" : colors.textMuted },
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tasks grouped by stage */}
        {tasks.isLoading ? (
          <SkeletonGroup count={4} itemHeight={64} />
        ) : filteredTasks.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No tasks found
          </Text>
        ) : (
          (Object.entries(tasksByStage) as [string, IProjectTask[]][]).map(([stageName, stageTasks]) => (
            <View key={stageName}>
              <View style={styles.stageHeader}>
                <Text style={[styles.stageName, { color: colors.textMuted }]}>
                  {stageName}
                </Text>
                <Text style={[styles.stageCount, { color: colors.textMuted }]}>
                  {stageTasks.length}
                </Text>
              </View>
              {stageTasks.map((task: IProjectTask) => (
                <View key={task.id}>
                  <TaskRow task={task} />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TaskRow({ task }: { task: IProjectTask }) {
  const { colors } = useTheme();

  const kanbanVariant =
    task.kanban_state === "done"
      ? "success"
      : task.kanban_state === "blocked"
        ? "danger"
        : "neutral";
  const kanbanLabel =
    task.kanban_state === "done"
      ? "Done"
      : task.kanban_state === "blocked"
        ? "Blocked"
        : "In Progress";

  const assignees = task.user_ids.map((u: [number, string]) => u[1]).join(", ");
  const hasProgress = task.planned_hours > 0;

  return (
    <View style={[styles.taskRow, { borderColor: colors.border }]}>
      <View style={styles.taskLeft}>
        <Text style={[styles.taskName, { color: colors.text }]} numberOfLines={2}>
          {task.name}
        </Text>
        <View style={styles.taskMeta}>
          <StatusBadge label={kanbanLabel} variant={kanbanVariant} size="sm" />
          {task.priority === "1" && (
            <StatusBadge label="Urgent" variant="danger" size="sm" />
          )}
          {task.date_deadline && (
            <Text style={[styles.taskDeadline, { color: colors.textMuted }]}>
              {formatDate(task.date_deadline)}
            </Text>
          )}
        </View>
        {assignees && (
          <Text style={[styles.taskAssignees, { color: colors.textMuted }]} numberOfLines={1}>
            {assignees}
          </Text>
        )}
      </View>

      {hasProgress && (
        <ProgressRing
          progress={task.progress}
          size={36}
          strokeWidth={3}
        />
      )}
    </View>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

  statsRow: { marginBottom: SPACING.md },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  progressInfo: { flex: 1 },
  progressLabel: { fontSize: 18, fontWeight: "700" },
  progressSub: { fontSize: 13, marginTop: 2 },

  kpiRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  kpiCard: { flex: 1 },

  hoursBar: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  hoursInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  hoursLabel: { fontSize: 13, fontWeight: "600" },
  hoursValue: { fontSize: 13, fontWeight: "700" },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },

  section: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: SPACING.sm },
  descText: { fontSize: 14, lineHeight: 20 },

  ratingRow: { flexDirection: "row", alignItems: "baseline", gap: SPACING.xs },
  ratingValue: { fontSize: 28, fontWeight: "700" },
  ratingSub: { fontSize: 14 },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  filterTabs: { flexDirection: "row", gap: SPACING.xs },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  filterTabText: { fontSize: 12, fontWeight: "600" },

  stageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
  },
  stageName: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  stageCount: { fontSize: 12, fontWeight: "600" },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  taskLeft: { flex: 1 },
  taskName: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginBottom: 2 },
  taskDeadline: { fontSize: 11, fontWeight: "500" },
  taskAssignees: { fontSize: 12, marginTop: 2 },

  emptyText: { textAlign: "center", paddingVertical: SPACING.xl, fontSize: 14 },
});
