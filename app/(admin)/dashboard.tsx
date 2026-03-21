import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import { useAuthStore } from "../../stores/auth-store";
import {
  useDashboardKPIs,
  useRevenueChart,
  usePipelineSummary,
  useRecentActivity,
  type IActivityItem,
  type IPipelineStage,
} from "../../hooks/use-dashboard-data";
import { KPICard } from "../../components/kpi-card";
import { StatusBadge } from "../../components/status-badge";
import { SkeletonLoader, SkeletonGroup } from "../../components/skeleton-loader";
import { ProgressRing } from "../../components/progress-ring";
import { MiniLineChart, MiniBarChart } from "../../components/mini-chart";
import { ErrorFallback } from "../../components/error-boundary";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const KPI_CARD_WIDTH = (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md) / 2;

export default function AdminDashboard() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const kpis = useDashboardKPIs();
  const revenue = useRevenueChart();
  const pipeline = usePipelineSummary();
  const activity = useRecentActivity();

  const isRefreshing =
    kpis.isRefetching || revenue.isRefetching || pipeline.isRefetching || activity.isRefetching;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["odoo", "dashboard"] });
  }, [queryClient]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const hasError = kpis.isError && !kpis.data;

  if (hasError) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorFallback
          error={kpis.error}
          title="Unable to load dashboard"
          onRetry={handleRefresh}
        />
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
          <Text style={[styles.greeting, { color: colors.textMuted }]}>
            {greeting},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {user?.name ?? "Admin"}
          </Text>
        </View>
        {user?.avatarUrl && (
          <TouchableOpacity
            onPress={() => router.push("/(admin)/settings")}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.headerAvatar}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Overview
        </Text>
      </View>

      {kpis.isLoading ? (
        <View style={styles.kpiGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader
              key={i}
              width={KPI_CARD_WIDTH}
              height={100}
              borderRadius={RADIUS.md}
            />
          ))}
        </View>
      ) : (
        <View style={styles.kpiGrid}>
          <KPICard
            label="Revenue"
            value={kpis.data?.revenue ?? 0}
            prefix="$"
            trend={
              (kpis.data?.revenueTrend ?? 0) >= 0 ? "up" : "down"
            }
            trendValue={`${Math.abs(kpis.data?.revenueTrend ?? 0)}%`}
            style={{ width: KPI_CARD_WIDTH }}
          />
          <KPICard
            label="Open Deals"
            value={kpis.data?.openOpportunities ?? 0}
            style={{ width: KPI_CARD_WIDTH }}
          />
          <KPICard
            label="Won Deals"
            value={kpis.data?.wonDeals ?? 0}
            trend="up"
            trendValue="this month"
            style={{ width: KPI_CARD_WIDTH }}
          />
          <KPICard
            label="Active Projects"
            value={kpis.data?.activeProjects ?? 0}
            style={{ width: KPI_CARD_WIDTH }}
          />
        </View>
      )}

      {/* Revenue Chart */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Revenue Trend
        </Text>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {revenue.isLoading ? (
          <SkeletonLoader
            width={SCREEN_WIDTH - SPACING.xl * 2 - SPACING.base * 2}
            height={120}
          />
        ) : revenue.data && revenue.data.length > 0 ? (
          <>
            <View style={styles.chartLabels}>
              {revenue.data.slice(0, 6).map((point, i) => (
                <Text
                  key={i}
                  style={[styles.chartLabel, { color: colors.textMuted }]}
                >
                  {point.month}
                </Text>
              ))}
            </View>
            <MiniLineChart
              data={revenue.data.map((p) => p.amount)}
              width={SCREEN_WIDTH - SPACING.xl * 2 - SPACING.base * 2}
              height={120}
            />
          </>
        ) : (
          <Text style={[styles.emptyChart, { color: colors.textMuted }]}>
            No revenue data available
          </Text>
        )}
      </View>

      {/* Pipeline Summary */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Pipeline
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(admin)/crm/")}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAll, { color: colors.gold }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {pipeline.isLoading ? (
        <SkeletonGroup count={3} itemHeight={56} style={styles.pipelineList} />
      ) : (
        <View style={styles.pipelineList}>
          {(pipeline.data ?? []).map((stage) => (
            <PipelineRow key={stage.id} stage={stage} />
          ))}
          {(pipeline.data ?? []).length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No pipeline stages
            </Text>
          )}
        </View>
      )}

      {/* Invoice Status */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Invoices
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(admin)/invoices/")}
          activeOpacity={0.7}
        >
          <Text style={[styles.seeAll, { color: colors.gold }]}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.invoiceRow}>
        <InvoiceStatCard
          label="Open"
          count={kpis.data?.openInvoices ?? 0}
          variant="info"
        />
        <InvoiceStatCard
          label="Overdue"
          count={kpis.data?.overdueInvoices ?? 0}
          variant="danger"
        />
      </View>

      {/* Task Completion Ring */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Tasks
        </Text>
      </View>

      <View style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ProgressRing
          progress={
            kpis.data
              ? ((kpis.data.tasksCompleted /
                  Math.max(kpis.data.tasksCompleted + kpis.data.tasksDue, 1)) *
                  100)
              : 0
          }
          size={72}
          strokeWidth={6}
        />
        <View style={styles.taskInfo}>
          <Text style={[styles.taskLabel, { color: colors.text }]}>
            {kpis.data?.tasksCompleted ?? 0} completed
          </Text>
          <Text style={[styles.taskSub, { color: colors.textMuted }]}>
            {kpis.data?.tasksDue ?? 0} remaining this sprint
          </Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
      </View>

      {activity.isLoading ? (
        <SkeletonGroup count={4} itemHeight={60} />
      ) : (
        <View>
          {(activity.data ?? []).slice(0, 8).map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
          {(activity.data ?? []).length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No recent activity
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// --- Sub-components ---

function PipelineRow({ stage }: { stage: IPipelineStage }) {
  const { colors } = useTheme();
  const totalAmount = stage.amount >= 1000
    ? `$${(stage.amount / 1000).toFixed(0)}K`
    : `$${stage.amount}`;

  return (
    <View style={[styles.pipelineRow, { borderColor: colors.border }]}>
      <View style={styles.pipelineLeft}>
        <Text style={[styles.pipelineName, { color: colors.text }]} numberOfLines={1}>
          {stage.name}
        </Text>
        <Text style={[styles.pipelineAmount, { color: colors.textMuted }]}>
          {totalAmount}
        </Text>
      </View>
      <View style={[styles.pipelineCount, { backgroundColor: colors.elevated }]}>
        <Text style={[styles.pipelineCountText, { color: colors.gold }]}>
          {stage.count}
        </Text>
      </View>
    </View>
  );
}

function InvoiceStatCard({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: "info" | "danger";
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.invoiceCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <StatusBadge label={label} variant={variant} />
      <Text style={[styles.invoiceCount, { color: colors.text }]}>{count}</Text>
    </View>
  );
}

function ActivityRow({ item }: { item: IActivityItem }) {
  const { colors } = useTheme();

  const typeLabel =
    item.type === "crm"
      ? "CRM"
      : item.type === "invoice"
        ? "Invoice"
        : item.type === "project"
          ? "Project"
          : "Task";

  const typeVariant =
    item.type === "crm"
      ? "gold"
      : item.type === "invoice"
        ? "info"
        : item.type === "project"
          ? "success"
          : "neutral";

  return (
    <View style={[styles.activityRow, { borderColor: colors.border }]}>
      <View style={styles.activityContent}>
        <View style={styles.activityTop}>
          <StatusBadge label={typeLabel} variant={typeVariant as "gold"} size="sm" />
          <Text style={[styles.activityDate, { color: colors.textMuted }]}>
            {item.date}
          </Text>
        </View>
        <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.activitySubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {item.subtitle} · {item.userName}
        </Text>
      </View>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },

  // Chart
  chartCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    overflow: "hidden",
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptyChart: {
    textAlign: "center",
    paddingVertical: SPACING["2xl"],
    fontSize: 14,
  },

  // Pipeline
  pipelineList: {
    gap: 0,
  },
  pipelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  pipelineLeft: {
    flex: 1,
  },
  pipelineName: {
    fontSize: 15,
    fontWeight: "600",
  },
  pipelineAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  pipelineCount: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    minWidth: 32,
    alignItems: "center",
  },
  pipelineCountText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Invoices
  invoiceRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  invoiceCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    alignItems: "center",
    gap: SPACING.sm,
  },
  invoiceCount: {
    fontSize: 28,
    fontWeight: "700",
  },

  // Tasks
  taskCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.base,
  },
  taskInfo: {
    flex: 1,
  },
  taskLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  taskSub: {
    fontSize: 13,
    marginTop: 2,
  },

  // Activity
  activityRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  activityContent: {
    gap: 4,
  },
  activityTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityDate: {
    fontSize: 11,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  activitySubtitle: {
    fontSize: 13,
  },

  // Empty
  emptyText: {
    textAlign: "center",
    paddingVertical: SPACING.xl,
    fontSize: 14,
  },
});
