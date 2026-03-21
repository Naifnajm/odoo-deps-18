import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import { useProjectDetail, useProjectTasks } from "../../../hooks/use-projects";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { ProgressRing } from "../../../components/progress-ring";
import { KPICard } from "../../../components/kpi-card";
import { SkeletonGroup } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";

export default function ClientProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Number(id) || 0;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: project, isLoading, isError, refetch } = useProjectDetail(projectId);
  const tasks = useProjectTasks(projectId);

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
        <SkeletonGroup count={5} style={{ padding: SPACING.xl }} />
      </View>
    );
  }

  const completed = project.task_count - project.open_task_count;
  const progress = project.task_count > 0 ? (completed / project.task_count) * 100 : 0;
  const totalHours = (tasks.data?.records ?? []).reduce((s: number, t: any) => s + t.effective_hours, 0);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title={project.name} showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ProgressRing progress={progress} size={72} strokeWidth={6} showLabel />
          <View style={styles.progressInfo}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>
              {completed} of {project.task_count} tasks
            </Text>
            <Text style={[styles.progressSub, { color: colors.textMuted }]}>completed</Text>
            {project.last_update_status && (
              <StatusBadge
                label={project.last_update_status}
                variant="gold"
                size="sm"
              />
            )}
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KPICard label="Open Tasks" value={project.open_task_count} style={styles.kpiCard} />
          <KPICard label="Hours Logged" value={Math.round(totalHours)} suffix="h" style={styles.kpiCard} />
        </View>

        {/* Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          {project.user_id && (
            <InfoRow label="Project Manager" value={project.user_id[1]} colors={colors} />
          )}
          {project.date_start && (
            <InfoRow label="Start Date" value={formatDate(project.date_start)} colors={colors} />
          )}
          {project.date && (
            <InfoRow label="End Date" value={formatDate(project.date)} colors={colors} />
          )}
          {project.rating_count > 0 && (
            <InfoRow label="Rating" value={`${project.rating_avg.toFixed(1)} / 5 (${project.rating_count})`} colors={colors} />
          )}
        </View>

        {/* Tasks */}
        <Text style={[styles.sectionTitle2, { color: colors.text }]}>Tasks</Text>

        {tasks.isLoading ? (
          <SkeletonGroup count={4} itemHeight={56} />
        ) : (tasks.data?.records ?? []).length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks</Text>
        ) : (
          (tasks.data?.records ?? []).map((task: any) => {
            const kanbanVariant = task.kanban_state === "done" ? "success" : task.kanban_state === "blocked" ? "danger" : "info";
            const kanbanLabel = task.kanban_state === "done" ? "Done" : task.kanban_state === "blocked" ? "Blocked" : "In Progress";

            return (
              <View
                key={task.id}
                style={[styles.taskRow, { borderColor: colors.border }]}
              >
                <View style={styles.taskLeft}>
                  <Text style={[styles.taskName, { color: colors.text }]} numberOfLines={1}>
                    {task.name}
                  </Text>
                  <View style={styles.taskMeta}>
                    <StatusBadge label={kanbanLabel} variant={kanbanVariant} size="sm" />
                    {task.date_deadline && (
                      <Text style={[styles.taskDeadline, { color: colors.textMuted }]}>
                        Due {formatDate(task.date_deadline)}
                      </Text>
                    )}
                  </View>
                </View>
                {task.planned_hours > 0 && (
                  <ProgressRing progress={task.progress} size={32} strokeWidth={3} />
                )}
              </View>
            );
          })
        )}

        {/* Description */}
        {project.description && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              {stripHtml(project.description)}
            </Text>
          </View>
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
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  progressInfo: { flex: 1, gap: SPACING.xs },
  progressLabel: { fontSize: 18, fontWeight: "700" },
  progressSub: { fontSize: 13 },

  kpiRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.xl },
  kpiCard: { flex: 1 },

  section: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: SPACING.md },
  sectionTitle2: { fontSize: 17, fontWeight: "700", marginBottom: SPACING.md },
  descText: { fontSize: 14, lineHeight: 20 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "600" },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  taskLeft: { flex: 1, gap: SPACING.xs },
  taskName: { fontSize: 14, fontWeight: "600" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  taskDeadline: { fontSize: 11, fontWeight: "500" },

  emptyText: { textAlign: "center", paddingVertical: SPACING.xl, fontSize: 14 },
});
