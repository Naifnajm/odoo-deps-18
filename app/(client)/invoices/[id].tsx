import { useCallback } from "react";
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
import {
  useInvoiceDetail,
  useInvoiceLines,
  type IInvoiceLine,
  type TPaymentState,
} from "../../../hooks/use-invoices";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { KPICard } from "../../../components/kpi-card";
import { SkeletonGroup } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";

const PAYMENT_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  paid: { label: "Paid", variant: "success" },
  in_payment: { label: "In Payment", variant: "info" },
  partial: { label: "Partial", variant: "warning" },
  not_paid: { label: "Not Paid", variant: "danger" },
  reversed: { label: "Reversed", variant: "neutral" },
};

export default function ClientInvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = Number(id) || 0;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: invoice, isLoading, isError, refetch } = useInvoiceDetail(invoiceId);
  const lines = useInvoiceLines(invoiceId);

  if (isError && !invoice) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Invoice" showBack />
        <ErrorFallback title="Invoice not found" onRetry={() => refetch()} />
      </View>
    );
  }

  if (isLoading || !invoice) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Loading..." showBack />
        <SkeletonGroup count={5} style={{ padding: SPACING.xl }} />
      </View>
    );
  }

  const badge = PAYMENT_BADGE[invoice.payment_state] ?? PAYMENT_BADGE.not_paid;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={invoice.name}
        subtitle={invoice.partner_id ? invoice.partner_id[1] : undefined}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <View style={styles.badgeRow}>
          <StatusBadge label={badge.label} variant={badge.variant} />
          <StatusBadge
            label={invoice.state === "posted" ? "Posted" : invoice.state === "draft" ? "Draft" : "Cancelled"}
            variant={invoice.state === "posted" ? "gold" : "neutral"}
          />
        </View>

        {/* Amounts */}
        <View style={styles.kpiRow}>
          <KPICard
            label="Total"
            value={invoice.amount_total}
            prefix="$"
            style={styles.kpiCard}
          />
          <KPICard
            label="Amount Due"
            value={invoice.amount_residual}
            prefix="$"
            trend={invoice.amount_residual > 0 ? "down" : "neutral"}
            style={styles.kpiCard}
          />
        </View>

        {/* Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          {invoice.invoice_date && (
            <InfoRow label="Invoice Date" value={formatDate(invoice.invoice_date)} colors={colors} />
          )}
          {invoice.invoice_date_due && (
            <InfoRow label="Due Date" value={formatDate(invoice.invoice_date_due)} colors={colors} />
          )}
          <InfoRow label="Untaxed" value={`$${invoice.amount_untaxed.toLocaleString()}`} colors={colors} />
          <InfoRow label="Tax" value={`$${invoice.amount_tax.toLocaleString()}`} colors={colors} />
          <InfoRow label="Currency" value={invoice.currency_id[1]} colors={colors} />
          {invoice.ref && <InfoRow label="Reference" value={invoice.ref} colors={colors} />}
        </View>

        {/* Lines */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Line Items</Text>

          {lines.isLoading ? (
            <SkeletonGroup count={3} itemHeight={50} />
          ) : (lines.data?.records ?? []).length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No line items</Text>
          ) : (
            (lines.data?.records ?? []).map((line) => (
              <View key={line.id} style={[styles.lineRow, { borderColor: colors.border }]}>
                <View style={styles.lineLeft}>
                  <Text style={[styles.lineName, { color: colors.text }]} numberOfLines={2}>
                    {line.name || "—"}
                  </Text>
                  <Text style={[styles.lineQty, { color: colors.textMuted }]}>
                    {line.quantity} × ${line.price_unit.toLocaleString()}
                  </Text>
                </View>
                <Text style={[styles.lineTotal, { color: colors.gold }]}>
                  ${line.price_subtotal.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
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
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  badgeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },

  kpiRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  kpiCard: { flex: 1 },

  section: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: SPACING.md },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "600" },

  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  lineLeft: { flex: 1, marginRight: SPACING.md },
  lineName: { fontSize: 14, fontWeight: "500" },
  lineQty: { fontSize: 12, marginTop: 2 },
  lineTotal: { fontSize: 15, fontWeight: "700" },

  emptyText: { textAlign: "center", paddingVertical: SPACING.md, fontSize: 14 },
});
