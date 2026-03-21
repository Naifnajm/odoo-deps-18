import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import {
  useLeaveAllocations,
  useAttendance,
  usePayslips,
} from "../../../hooks/use-employee";
import { ScreenHeader } from "../../../components/screen-header";
import { KPICard } from "../../../components/kpi-card";
import { SkeletonLoader } from "../../../components/skeleton-loader";

export default function HrIndex() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const leaves = useLeaveAllocations();
  const attendance = useAttendance();
  const payslips = usePayslips();

  const totalLeaveBalance = (leaves.data?.records ?? []).reduce(
    (s: number, l: any) => s + l.remaining_leaves,
    0
  );

  const hoursThisMonth = (attendance.data?.records ?? [])
    .filter((a: any) => {
      const checkIn = new Date(a.check_in);
      const now = new Date();
      return (
        checkIn.getMonth() === now.getMonth() &&
        checkIn.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s: number, a: any) => s + a.worked_hours, 0);

  const latestPayslip = (payslips.data?.records ?? [])[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="HR Portal" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Summary */}
        <View style={styles.kpiRow}>
          {leaves.isLoading ? (
            <>
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
              <SkeletonLoader width="48%" height={90} borderRadius={RADIUS.md} />
            </>
          ) : (
            <>
              <KPICard
                label="Leave Balance"
                value={totalLeaveBalance}
                suffix="d"
                style={styles.kpiCard}
              />
              <KPICard
                label="Hours This Month"
                value={Math.round(hoursThisMonth)}
                suffix="h"
                style={styles.kpiCard}
              />
            </>
          )}
        </View>

        {latestPayslip && (
          <View style={[styles.payslipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.payslipLabel, { color: colors.textMuted }]}>
              Latest Payslip
            </Text>
            <Text style={[styles.payslipAmount, { color: colors.gold }]}>
              ${latestPayslip.net_wage.toLocaleString()}
            </Text>
            <Text style={[styles.payslipPeriod, { color: colors.textMuted }]}>
              {formatDate(latestPayslip.date_from)} - {formatDate(latestPayslip.date_to)}
            </Text>
          </View>
        )}

        {/* Navigation Cards */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Self Service</Text>

        <NavCard
          title="Leave Requests"
          description="View and request time off"
          colors={colors}
          onPress={() => router.push("/(employee)/hr/leaves")}
        />
        <NavCard
          title="Payslips"
          description="View your salary history"
          colors={colors}
          onPress={() => router.push("/(employee)/hr/payslips")}
        />
        <NavCard
          title="Attendance"
          description="View your check-in history"
          colors={colors}
          onPress={() => router.push("/(employee)/hr/attendance")}
        />
      </ScrollView>
    </View>
  );
}

function NavCard({
  title,
  description,
  colors,
  onPress,
}: {
  title: string;
  description: string;
  colors: Record<string, string>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.navCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.navCardContent}>
        <Text style={[styles.navCardTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.navCardDesc, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Text style={[styles.navArrow, { color: colors.textMuted }]}>{"\u203A"}</Text>
    </TouchableOpacity>
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  kpiRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.xl },
  kpiCard: { flex: 1 },

  payslipCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  payslipLabel: { fontSize: 12, fontWeight: "600", marginBottom: SPACING.xs },
  payslipAmount: { fontSize: 28, fontWeight: "700", marginBottom: SPACING.xs },
  payslipPeriod: { fontSize: 12 },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: SPACING.md },

  navCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  navCardContent: { flex: 1 },
  navCardTitle: { fontSize: 16, fontWeight: "600" },
  navCardDesc: { fontSize: 13, marginTop: 2 },
  navArrow: { fontSize: 24, fontWeight: "300" },
});
