import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { ListRenderItem } from "@shopify/flash-list";

import { useTheme } from "../../../theme/theme";
import { SPACING } from "../../../theme/spacing";
import { useAttendance, type IAttendance } from "../../../hooks/use-employee";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { StatusBadge } from "../../../components/status-badge";
import { KPICard } from "../../../components/kpi-card";
import { ScreenHeader } from "../../../components/screen-header";

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useAttendance();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("hr.attendance") });
  }, [queryClient]);

  const totalHours = useMemo(
    () => (data?.records ?? []).reduce((s: number, a: IAttendance) => s + a.worked_hours, 0),
    [data?.records]
  );

  const renderItem: ListRenderItem<IAttendance> = useCallback(
    ({ item }: { item: IAttendance }) => <AttendanceRow attendance={item} />,
    []
  );

  const header = (
    <View style={styles.headerCard}>
      <KPICard
        label="Total Hours"
        value={Math.round(totalHours * 10) / 10}
        suffix="h"
        style={{ borderWidth: 0 }}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Attendance" showBack />

      <OdooList
        data={data?.records}
        renderItem={renderItem}
        keyExtractor={(item: IAttendance) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={72}
        ListHeaderComponent={header}
        emptyTitle="No attendance records"
        emptyMessage="Your attendance history will appear here."
      />
    </View>
  );
}

function AttendanceRow({ attendance }: { attendance: IAttendance }) {
  const { colors } = useTheme();

  const isOpen = !attendance.check_out;
  const hours = attendance.worked_hours;

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.date, { color: colors.text }]}>
          {formatDate(attendance.check_in)}
        </Text>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatTime(attendance.check_in)}
          </Text>
          <Text style={[styles.separator, { color: colors.textMuted }]}>{"\u2192"}</Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {isOpen ? "..." : formatTime(attendance.check_out as string)}
          </Text>
        </View>
      </View>

      <View style={styles.rowRight}>
        {isOpen ? (
          <StatusBadge label="Active" variant="success" size="sm" />
        ) : (
          <Text style={[styles.hours, { color: colors.gold }]}>
            {hours.toFixed(1)}h
          </Text>
        )}
      </View>
    </View>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerCard: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  rowLeft: {},
  date: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  time: { fontSize: 13, fontWeight: "500" },
  separator: { fontSize: 13 },
  rowRight: { alignItems: "flex-end" },
  hours: { fontSize: 16, fontWeight: "700" },
});
