import { useCallback, useMemo } from "react";
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
import {
  useEmployeeHomeSummary,
  useMyTasks,
  useCheckInOut,
  type IEmployeeTask,
} from "../../hooks/use-employee";
import { odooKeys } from "../../hooks/use-odoo-query";
import { KPICard } from "../../components/kpi-card";
import { StatusBadge } from "../../components/status-badge";
import { ProgressRing } from "../../components/progress-ring";
import { SkeletonGroup, SkeletonLoader } from "../../components/skeleton-loader";
import { ErrorFallback } from "../../components/error-boundary";

export default function EmployeeHome() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const summary = useEmployeeHomeSummary();
  const tasks = useMyTasks();
  const checkInOut = useCheckInOut();

  const isRefreshing = summary.isRefetching || tasks.isRefetching;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.custom("employee", "home_summary", []) });
    queryClient.invalidateQueries({ queryKey: odooKeys.model("project.task") });
  }, [queryClient]);

  const handleCheckInOut = useCallback(() => {
    checkInOut.mutate(
      { args: [[user?.uid ?? 0], "hr_attendance.hr_attendance_action_my_attendances"] },
      { onSuccess: () => handleRefresh() }
    );
  }, [checkInOut, user?.uid, handleRefresh]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const urgentTasks = useMemo(() => {
    const allTasks = tasks.data?.records ?? [];
    return allTasks
      .filter((t) => t.kanban_state !== "done")
      .slice(0, 5);
  }, [tasks.data?.records]);

  if (summary.isError && !summary.data) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorFallback title="Unable to load dashboard" onRetry={handleRefresh} />
      </View>
    );
  }

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
          <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting},</Text>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {user?.name ?? "Employee"}
          </Text>
        </View>
        {user?.avatarUrl && (
          <TouchableOpacity
            onPress={() => router.push("/(employee)/settings")}
            activeOpacity={0.7}
          >
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
          </TouchableOpacity>
        )}
      </View>

      {/* Check In/Out Button */}
      <TouchableOpacity
        style={[
          styles.checkInCard,
          {
            backgroundColor: summary.data?.isCheckedIn ? colors.success : colors.gold,
          },
        ]}
        onPress={handleCheckInOut}
        activeOpacity={0.8}
        disabled={checkInOut.isPending}
      >
        <View style={styles.checkInContent}>
          <Text style={styles.checkInTitle}>
            {summary.data?.isCheckedIn ? "Check Out" : "Check In"}
          </Text>
          {summary.data?.lastCheckIn && (
            <Text style={styles.checkInSub}>
              Last: {formatTime(summary.data.lastCheckIn)}
            </Text>
          )}
        </View>
        <View style={styles.checkInDot}>
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: summary.data?.isCheckedIn ? "#fff" : "#080C14" },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        {summary.isLoading ? (
          <>
            <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
            <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
            <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
            <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
          </>
        ) : (
          <>
            <KPICard
              label="Tasks Today"
              value={summary.data?.tasksToday ?? 0}
              style={styles.kpiCard}
            />
            <KPICard
              label="Tasks Due"
              value={summary.data?.tasksDue ?? 0}
              trend={
                (summary.data?.tasksDue ?? 0) > 0 ? "down" : "neutral"
              }
              trendValue={(summary.data?.tasksDue ?? 0) > 0 ? "urgent" : "none"}
              style={styles.kpiCard}
            />
            <KPICard
              label="Hours This Week"
              value={Math.round(summary.data?.hoursThisWeek ?? 0)}
              suffix="h"
              style={styles.kpiCard}
            />
            <KPICard
              label="Leave Balance"
              value={summary.data?.leaveBalance ?? 0}
              suffix="d"
              style={styles.kpiCard}
            />
          </>
        )}
      </View>

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        <QuickLink
          label="My Tasks"
          count={tasks.data?.records?.length}
          colors={colors}
          onPress={() => router.push("/(employee)/tasks/")}
        />
        <QuickLink
          label="Leaves"
          colors={colors}
          onPress={() => router.push("/(employee)/hr/leaves")}
        />
        <QuickLink
          label="Payslips"
          colors={colors}
          onPress={() => router.push("/(employee)/hr/payslips")}
        />
      </View>

      {/* Upcoming Tasks */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Tasks</Text>
        <TouchableOpacity onPress={() => router.push("/(employee)/tasks/")} activeOpacity={0.7}>
          <Text style={[styles.seeAll, { color: colors.gold }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {tasks.isLoading ? (
        <SkeletonGroup count={4} itemHeight={64} />
      ) : urgentTasks.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No upcoming tasks
        </Text>
      ) : (
        urgentTasks.map((task) => (
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
              <View style={styles.taskMeta}>
                <Text style={[styles.taskProject, { color: colors.textMuted }]} numberOfLines={1}>
                  {task.project_id[1]}
                </Text>
                {task.date_deadline && (
                  <Text style={[styles.taskDeadline, { color: colors.textMuted }]}>
                    {formatDeadline(task.date_deadline)}
                  </Text>
                )}
              </View>
            </View>
            {task.planned_hours > 0 && (
              <ProgressRing progress={task.progress} size={36} strokeWidth={3} />
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function QuickLink({
  label,
  count,
  colors,
  onPress,
}: {
  label: string;
  count?: number;
  colors: Record<string, string>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickLink, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.quickLinkLabel, { color: colors.text }]}>{label}</Text>
      {count !== undefined && (
        <Text style={[styles.quickLinkCount, { color: colors.gold }]}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
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
  avatar: { width: 44, height: 44, borderRadius: 22 },

  checkInCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  checkInContent: {},
  checkInTitle: { fontSize: 20, fontWeight: "700", color: "#080C14" },
  checkInSub: { fontSize: 13, color: "#080C14", opacity: 0.7, marginTop: 2 },
  checkInDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  pulseDot: { width: 12, height: 12, borderRadius: 6 },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  kpiCard: { width: "47%" },

  quickLinks: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  quickLink: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.xs,
  },
  quickLinkLabel: { fontSize: 13, fontWeight: "600" },
  quickLinkCount: { fontSize: 18, fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600" },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  taskLeft: { flex: 1 },
  taskName: { fontSize: 15, fontWeight: "600" },
  taskMeta: { flexDirection: "row", gap: SPACING.sm, marginTop: 2 },
  taskProject: { fontSize: 12 },
  taskDeadline: { fontSize: 12, fontWeight: "600" },

  emptyText: { textAlign: "center", paddingVertical: SPACING.xl, fontSize: 14 },
});
