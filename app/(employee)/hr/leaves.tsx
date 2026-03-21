import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import {
  useLeaveAllocations,
  useLeaveRequests,
  type ILeaveAllocation,
  type ILeaveRequest,
} from "../../../hooks/use-employee";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { ProgressRing } from "../../../components/progress-ring";
import { SkeletonGroup } from "../../../components/skeleton-loader";

export default function LeavesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const allocations = useLeaveAllocations();
  const requests = useLeaveRequests();

  const isRefreshing = allocations.isRefetching || requests.isRefetching;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("hr.leave") });
    queryClient.invalidateQueries({ queryKey: odooKeys.model("hr.leave.allocation") });
  }, [queryClient]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Leaves" showBack />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
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
        {/* Allocations / Balances */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Leave Balances</Text>

        {allocations.isLoading ? (
          <SkeletonGroup count={3} itemHeight={80} />
        ) : (allocations.data?.records ?? []).length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No leave allocations found
          </Text>
        ) : (
          (allocations.data?.records ?? []).map((alloc) => (
            <AllocationCard key={alloc.id} allocation={alloc} colors={colors} />
          ))
        )}

        {/* Leave Requests */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: SPACING.xl }]}>
          My Requests
        </Text>

        {requests.isLoading ? (
          <SkeletonGroup count={4} itemHeight={64} />
        ) : (requests.data?.records ?? []).length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No leave requests
          </Text>
        ) : (
          (requests.data?.records ?? []).map((req) => (
            <LeaveRequestRow key={req.id} request={req} colors={colors} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AllocationCard({
  allocation,
  colors,
}: {
  allocation: ILeaveAllocation;
  colors: Record<string, string>;
}) {
  const used = allocation.leaves_taken;
  const total = allocation.max_leaves;
  const remaining = allocation.remaining_leaves;
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <View style={[styles.allocCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ProgressRing progress={progress} size={52} strokeWidth={4} showLabel />
      <View style={styles.allocInfo}>
        <Text style={[styles.allocType, { color: colors.text }]}>
          {allocation.holiday_status_id[1]}
        </Text>
        <Text style={[styles.allocDetail, { color: colors.textMuted }]}>
          {remaining} days remaining of {total}
        </Text>
        <Text style={[styles.allocUsed, { color: colors.textMuted }]}>
          {used} days used
        </Text>
      </View>
    </View>
  );
}

function LeaveRequestRow({
  request,
  colors,
}: {
  request: ILeaveRequest;
  colors: Record<string, string>;
}) {
  const stateVariant = getLeaveStateVariant(request.state);
  const stateLabel = getLeaveStateLabel(request.state);

  return (
    <View style={[styles.requestRow, { borderColor: colors.border }]}>
      <View style={styles.requestLeft}>
        <Text style={[styles.requestType, { color: colors.text }]}>
          {request.holiday_status_id[1]}
        </Text>
        <Text style={[styles.requestDates, { color: colors.textMuted }]}>
          {formatDate(request.date_from)} - {formatDate(request.date_to)}
        </Text>
        <Text style={[styles.requestDays, { color: colors.textMuted }]}>
          {request.number_of_days} day{request.number_of_days !== 1 ? "s" : ""}
        </Text>
      </View>
      <StatusBadge label={stateLabel} variant={stateVariant} size="sm" />
    </View>
  );
}

function getLeaveStateVariant(state: string): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (state) {
    case "validate": return "success";
    case "validate1": return "info";
    case "confirm": return "warning";
    case "refuse": return "danger";
    default: return "neutral";
  }
}

function getLeaveStateLabel(state: string): string {
  switch (state) {
    case "validate": return "Approved";
    case "validate1": return "1st Approval";
    case "confirm": return "Pending";
    case "refuse": return "Refused";
    case "draft": return "Draft";
    default: return state;
  }
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: SPACING.md },

  allocCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.base,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  allocInfo: { flex: 1 },
  allocType: { fontSize: 15, fontWeight: "600" },
  allocDetail: { fontSize: 13, marginTop: 2 },
  allocUsed: { fontSize: 12, marginTop: 1 },

  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  requestLeft: { flex: 1 },
  requestType: { fontSize: 15, fontWeight: "600" },
  requestDates: { fontSize: 13, marginTop: 2 },
  requestDays: { fontSize: 12, marginTop: 1 },

  emptyText: { textAlign: "center", paddingVertical: SPACING.xl, fontSize: 14 },
});
