import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ListRenderItem } from "@shopify/flash-list";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import {
  useInvoices,
  type IInvoice,
  type TInvoiceState,
  type TPaymentState,
} from "../../../hooks/use-invoices";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { StatusBadge } from "../../../components/status-badge";
import { ScreenHeader } from "../../../components/screen-header";
import { ErrorFallback } from "../../../components/error-boundary";

type TFilter = "all" | "draft" | "posted" | "paid" | "overdue";

export default function AdminInvoicesIndex() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<TFilter>("all");

  const { data, isLoading, isRefetching, isError } = useInvoices();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("account.move") });
  }, [queryClient]);

  const filteredInvoices = useMemo(() => {
    let records = data?.records ?? [];

    // Apply filter
    if (filter === "draft") {
      records = records.filter((i) => i.state === "draft");
    } else if (filter === "posted") {
      records = records.filter((i) => i.state === "posted" && i.payment_state !== "paid");
    } else if (filter === "paid") {
      records = records.filter((i) => i.payment_state === "paid");
    } else if (filter === "overdue") {
      const now = new Date();
      records = records.filter(
        (i) =>
          i.state === "posted" &&
          i.payment_state !== "paid" &&
          i.invoice_date_due &&
          new Date(i.invoice_date_due) < now
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.partner_id && i.partner_id[1].toLowerCase().includes(q)) ||
          (i.ref && i.ref.toLowerCase().includes(q))
      );
    }

    return records;
  }, [data?.records, filter, searchQuery]);

  const totals = useMemo(() => {
    const invoices = filteredInvoices;
    return {
      total: invoices.reduce((s, i) => s + i.amount_total, 0),
      residual: invoices.reduce((s, i) => s + i.amount_residual, 0),
      count: invoices.length,
    };
  }, [filteredInvoices]);

  const renderItem: ListRenderItem<IInvoice> = useCallback(
    ({ item }) => <InvoiceRow invoice={item} />,
    []
  );

  if (isError && !data) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Invoices" />
        <ErrorFallback title="Unable to load invoices" onRetry={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Invoices"
        subtitle={`${totals.count} invoices · ${formatCurrency(totals.total)}`}
      />

      {/* Search */}
      <View style={[styles.searchRow, { borderColor: colors.border }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search invoices..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderColor: colors.border }]}>
        {(["all", "draft", "posted", "paid", "overdue"] as TFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              { backgroundColor: filter === f ? colors.gold : colors.elevated },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#080C14" : colors.textMuted },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary bar */}
      {totals.residual > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Amount Due
          </Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>
            {formatCurrency(totals.residual)}
          </Text>
        </View>
      )}

      <OdooList
        data={filteredInvoices}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={80}
        emptyTitle="No invoices"
        emptyMessage="No invoices found matching your criteria."
      />
    </View>
  );
}

function InvoiceRow({ invoice }: { invoice: IInvoice }) {
  const { colors } = useTheme();

  const stateVariant = getStateVariant(invoice.state, invoice.payment_state);
  const stateLabel = getStateLabel(invoice.state, invoice.payment_state);

  const isOverdue =
    invoice.state === "posted" &&
    invoice.payment_state !== "paid" &&
    invoice.invoice_date_due &&
    new Date(invoice.invoice_date_due) < new Date();

  const isRefund = invoice.move_type === "out_refund";

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={() => router.push(`/(admin)/invoices/${invoice.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {invoice.name}
          </Text>
          {isRefund && <StatusBadge label="Credit" variant="warning" size="sm" />}
        </View>
        {invoice.partner_id && (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {invoice.partner_id[1]}
          </Text>
        )}
        <View style={styles.rowMeta}>
          <StatusBadge label={stateLabel} variant={stateVariant} size="sm" />
          {isOverdue && <StatusBadge label="Overdue" variant="danger" size="sm" />}
          {invoice.invoice_date && (
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {formatDate(invoice.invoice_date)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rowRight}>
        <Text style={[styles.amount, { color: colors.text }]}>
          {formatCurrency(invoice.amount_total)}
        </Text>
        {invoice.amount_residual > 0 && invoice.amount_residual !== invoice.amount_total && (
          <Text style={[styles.residual, { color: colors.danger }]}>
            Due: {formatCurrency(invoice.amount_residual)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getStateVariant(
  state: TInvoiceState,
  paymentState: TPaymentState
): "success" | "warning" | "danger" | "info" | "neutral" {
  if (paymentState === "paid") return "success";
  if (paymentState === "partial") return "warning";
  if (state === "draft") return "neutral";
  if (state === "posted") return "info";
  if (state === "cancel") return "danger";
  return "neutral";
}

function getStateLabel(state: TInvoiceState, paymentState: TPaymentState): string {
  if (paymentState === "paid") return "Paid";
  if (paymentState === "partial") return "Partial";
  if (paymentState === "in_payment") return "In Payment";
  if (state === "draft") return "Draft";
  if (state === "posted") return "Open";
  if (state === "cancel") return "Cancelled";
  return state;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
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
  searchRow: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  filterText: { fontSize: 12, fontWeight: "600" },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  summaryLabel: { fontSize: 13, fontWeight: "600" },
  summaryValue: { fontSize: 16, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  rowLeft: { flex: 1 },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  rowTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  rowSubtitle: { fontSize: 13, marginTop: 2 },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  dateText: { fontSize: 11, fontWeight: "500" },
  rowRight: { alignItems: "flex-end" },
  amount: { fontSize: 16, fontWeight: "700" },
  residual: { fontSize: 12, fontWeight: "600", marginTop: 2 },
});
