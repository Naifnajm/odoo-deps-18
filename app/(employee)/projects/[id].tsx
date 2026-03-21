import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
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

export default function EmployeeProjectDetail() {
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
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ProgressRing progress={progress} size={64} strokeWidth={5} />
          <View style={styles.progressInfo}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>
              {completed}/{project.task_count} tasks
            </Text>
            <Text style={[styles.progressSub, { color: colors.textMuted }]}>completed</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <KPICard label="Open" value={project.open_task_count} style={styles.kpiCard} />
          <KPICard
            label="Hours"
            value={Math.round((tasks.data?.records ?? []).reduce((s: number, t: any) => s + t.effective_hours, 0))}
            suffix="h"
            style={styles.kpiCard}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>

        {tasks.isLoading ? (
          <SkeletonGroup count={4} itemHeight={60} />
        ) : (tasks.data?.records ?? []).length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks</Text>
        ) : (
          (tasks.data?.records ?? []).map((task: any) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, { borderColor: colors.border }]}
              onPress={() => router.push(`/(employee)/tasks/${task.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.taskLeft}>
                <Text style={[styles.taskName, { color: colors.text }]} numberOfLines={1}>
                  {task.name}
                </Text>
                <StatusBadge
                  label={
                    task.kanban_state === "done" ? "Done" : task.kanban_state === "blocked" ? "Blocked" : "In Progress"
                  }
                  variant={
                    task.kanban_state === "done" ? "success" : task.kanban_state === "blocked" ? "danger" : "info"
                  }
                  size="sm"
                />
              </View>
              {task.planned_hours > 0 && (
                <ProgressRing progress={task.progress} size={32} strokeWidth={3} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
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
  progressInfo: { flex: 1 },
  progressLabel: { fontSize: 18, fontWeight: "700" },
  progressSub: { fontSize: 13, marginTop: 2 },

  kpiRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.xl },
  kpiCard: { flex: 1 },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: SPACING.md },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  taskLeft: { flex: 1, gap: SPACING.xs },
  taskName: { fontSize: 14, fontWeight: "600" },

  emptyText: { textAlign: "center", paddingVertical: SPACING.xl, fontSize: 14 },
});
