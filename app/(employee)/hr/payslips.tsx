import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { ListRenderItem } from "@shopify/flash-list";

import { useTheme } from "../../../theme/theme";
import { SPACING } from "../../../theme/spacing";
import { usePayslips, type IPayslip } from "../../../hooks/use-employee";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { ScreenHeader } from "../../../components/screen-header";

export default function PayslipsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = usePayslips();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("hr.payslip") });
  }, [queryClient]);

  const renderItem: ListRenderItem<IPayslip> = useCallback(
    ({ item }: { item: IPayslip }) => <PayslipRow payslip={item} />,
    []
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Payslips" showBack />

      <OdooList
        data={data?.records}
        renderItem={renderItem}
        keyExtractor={(item: IPayslip) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={88}
        emptyTitle="No payslips"
        emptyMessage="No payslips available yet."
      />
    </View>
  );
}

function PayslipRow({ payslip }: { payslip: IPayslip }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {payslip.name || payslip.number}
        </Text>
        <Text style={[styles.period, { color: colors.textMuted }]}>
          {formatDate(payslip.date_from)} - {formatDate(payslip.date_to)}
        </Text>
        <View style={styles.wageRow}>
          <WageItem label="Gross" amount={payslip.gross_wage} colors={colors} />
          <WageItem label="Net" amount={payslip.net_wage} colors={colors} highlight />
        </View>
      </View>
    </View>
  );
}

function WageItem({
  label,
  amount,
  colors,
  highlight = false,
}: {
  label: string;
  amount: number;
  colors: Record<string, string>;
  highlight?: boolean;
}) {
  return (
    <View style={styles.wageItem}>
      <Text style={[styles.wageLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          styles.wageAmount,
          { color: highlight ? colors.gold : colors.text },
        ]}
      >
        ${amount.toLocaleString()}
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  rowLeft: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  period: { fontSize: 12, marginBottom: SPACING.sm },
  wageRow: { flexDirection: "row", gap: SPACING.xl },
  wageItem: {},
  wageLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  wageAmount: { fontSize: 16, fontWeight: "700", marginTop: 1 },
});
