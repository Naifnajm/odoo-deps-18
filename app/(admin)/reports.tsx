import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import {
  useDashboardKPIs,
  useRevenueChart,
  usePipelineSummary,
} from "../../hooks/use-dashboard-data";
import { odooKeys } from "../../hooks/use-odoo-query";
import { KPICard } from "../../components/kpi-card";
import { ScreenHeader } from "../../components/screen-header";
import { SkeletonLoader, SkeletonGroup } from "../../components/skeleton-loader";

type TPeriod = "month" | "quarter" | "year";

export default function ReportsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<TPeriod>("month");

  const kpis = useDashboardKPIs();
  const revenue = useRevenueChart();
  const pipeline = usePipelineSummary();

  const isRefreshing = kpis.isRefetching || revenue.isRefetching;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.custom("dashboard", "kpis", []) });
    queryClient.invalidateQueries({ queryKey: odooKeys.custom("dashboard", "revenue", []) });
    queryClient.invalidateQueries({ queryKey: odooKeys.custom("dashboard", "pipeline", []) });
  }, [queryClient]);

  const revenueData = revenue.data ?? [];
  const maxRevenue = useMemo(
    () => Math.max(...revenueData.map((r) => r.amount), 1),
    [revenueData]
  );

  const pipelineData = pipeline.data ?? [];
  const totalPipelineAmount = useMemo(
    () => pipelineData.reduce((s, p) => s + p.amount, 0),
    [pipelineData]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Reports" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
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
        {/* Period Filter */}
        <View style={styles.periodRow}>
          {(["month", "quarter", "year"] as TPeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodTab,
                { backgroundColor: period === p ? colors.gold : colors.elevated },
              ]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: period === p ? "#080C14" : colors.textMuted },
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Financial KPIs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial</Text>
        <View style={styles.kpiGrid}>
          {kpis.isLoading ? (
            <>
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
            </>
          ) : (
            <>
              <KPICard
                label="Revenue"
                value={kpis.data?.revenue ?? 0}
                prefix="$"
                trend={
                  (kpis.data?.revenueTrend ?? 0) > 0
                    ? "up"
                    : (kpis.data?.revenueTrend ?? 0) < 0
                      ? "down"
                      : "neutral"
                }
                trendValue={`${Math.abs(kpis.data?.revenueTrend ?? 0)}%`}
                style={styles.kpiCard}
              />
              <KPICard
                label="Open Invoices"
                value={kpis.data?.openInvoices ?? 0}
                style={styles.kpiCard}
              />
              <KPICard
                label="Overdue"
                value={kpis.data?.overdueInvoices ?? 0}
                trend={
                  (kpis.data?.overdueInvoices ?? 0) > 0 ? "down" : "neutral"
                }
                style={styles.kpiCard}
              />
              <KPICard
                label="Won Deals"
                value={kpis.data?.wonDeals ?? 0}
                style={styles.kpiCard}
              />
            </>
          )}
        </View>

        {/* Revenue Chart (bar chart) */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Trend</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {revenue.isLoading ? (
            <SkeletonLoader width="100%" height={160} borderRadius={RADIUS.sm} />
          ) : revenueData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No revenue data</Text>
          ) : (
            <View style={styles.barChart}>
              {revenueData.map((point, i) => {
                const barHeight = (point.amount / maxRevenue) * 140;
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barValue, { color: colors.textMuted }]}>
                      {formatCompact(point.amount)}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(barHeight, 4),
                          backgroundColor: colors.gold,
                        },
                      ]}
                    />
                    <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                      {point.month}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Pipeline Summary */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pipeline</Text>
        <View style={[styles.pipelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {pipeline.isLoading ? (
            <SkeletonGroup count={4} itemHeight={44} />
          ) : pipelineData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No pipeline data</Text>
          ) : (
            pipelineData.map((stage) => {
              const pct = totalPipelineAmount > 0 ? (stage.amount / totalPipelineAmount) * 100 : 0;
              return (
                <View key={stage.id} style={[styles.pipelineRow, { borderColor: colors.border }]}>
                  <View style={styles.pipelineLeft}>
                    <Text style={[styles.pipelineName, { color: colors.text }]}>{stage.name}</Text>
                    <Text style={[styles.pipelineCount, { color: colors.textMuted }]}>
                      {stage.count} deal{stage.count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.pipelineRight}>
                    <Text style={[styles.pipelineAmount, { color: colors.gold }]}>
                      ${formatCompact(stage.amount)}
                    </Text>
                    <View style={[styles.pipelineBarBg, { backgroundColor: colors.elevated }]}>
                      <View
                        style={[
                          styles.pipelineBarFill,
                          {
                            width: `${Math.max(pct, 2)}%`,
                            backgroundColor: colors.gold,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Operations KPIs */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Operations</Text>
        <View style={styles.kpiGrid}>
          {kpis.isLoading ? (
            <>
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
            </>
          ) : (
            <>
              <KPICard
                label="Active Projects"
                value={kpis.data?.activeProjects ?? 0}
                style={styles.kpiCard}
              />
              <KPICard
                label="Tasks Completed"
                value={kpis.data?.tasksCompleted ?? 0}
                style={styles.kpiCard}
              />
              <KPICard
                label="Tasks Due"
                value={kpis.data?.tasksDue ?? 0}
                trend={
                  (kpis.data?.tasksDue ?? 0) > 0 ? "down" : "neutral"
                }
                style={styles.kpiCard}
              />
              <KPICard
                label="Opportunities"
                value={kpis.data?.openOpportunities ?? 0}
                style={styles.kpiCard}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function formatCompact(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  periodRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  periodTab: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  periodText: { fontSize: 13, fontWeight: "600" },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: SPACING.md },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  kpiCard: { width: "47%" },

  chartCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 180,
    gap: 2,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barValue: { fontSize: 9, fontWeight: "600", marginBottom: 2 },
  bar: {
    width: "70%",
    borderRadius: 3,
    minHeight: 4,
  },
  barLabel: { fontSize: 9, marginTop: 4, fontWeight: "500" },

  pipelineCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
  },
  pipelineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  pipelineLeft: { flex: 1 },
  pipelineName: { fontSize: 14, fontWeight: "600" },
  pipelineCount: { fontSize: 11, marginTop: 1 },
  pipelineRight: { alignItems: "flex-end", width: 120 },
  pipelineAmount: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  pipelineBarBg: {
    width: "100%",
    height: 6,
    borderRadius: 3,
  },
  pipelineBarFill: {
    height: 6,
    borderRadius: 3,
  },

  emptyText: { textAlign: "center", paddingVertical: SPACING.xl, fontSize: 14 },
});
