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
import { useAuthStore } from "../../../stores/auth-store";
import { useInvoices, type IInvoice, type TPaymentState } from "../../../hooks/use-invoices";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { StatusBadge } from "../../../components/status-badge";
import { ScreenHeader } from "../../../components/screen-header";

type TFilter = "all" | "unpaid" | "paid" | "overdue";

const PAYMENT_BADGE: Record<TPaymentState, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  paid: { label: "Paid", variant: "success" },
  in_payment: { label: "In Payment", variant: "info" },
  partial: { label: "Partial", variant: "warning" },
  not_paid: { label: "Not Paid", variant: "danger" },
  reversed: { label: "Reversed", variant: "neutral" },
};

export default function ClientInvoicesIndex() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const partnerId = useAuthStore((s) => s.user?.partnerId);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<TFilter>("all");

  const { data, isLoading, isRefetching, isError } = useInvoices(
    partnerId
      ? [["partner_id", "=", partnerId], ["move_type", "=", "out_invoice"]]
      : [["move_type", "=", "out_invoice"]]
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("account.move") });
  }, [queryClient]);

  const filtered = useMemo(() => {
    let records = data?.records ?? [];
    const now = new Date();

    if (filter === "unpaid") records = records.filter((i) => i.payment_state === "not_paid" || i.payment_state === "partial");
    else if (filter === "paid") records = records.filter((i) => i.payment_state === "paid");
    else if (filter === "overdue") records = records.filter((i) => {
      if (i.payment_state === "paid") return false;
      return i.invoice_date_due && new Date(i.invoice_date_due) < now;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter((i) => i.name.toLowerCase().includes(q));
    }

    return records;
  }, [data?.records, filter, searchQuery]);

  const totalUnpaid = useMemo(() => {
    return (data?.records ?? [])
      .filter((i) => i.payment_state !== "paid")
      .reduce((s, i) => s + i.amount_residual, 0);
  }, [data?.records]);

  const renderItem: ListRenderItem<IInvoice> = useCallback(
    ({ item }) => <InvoiceRow invoice={item} />,
    []
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="My Invoices"
        subtitle={totalUnpaid > 0 ? `$${totalUnpaid.toLocaleString()} unpaid` : undefined}
      />

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

      <View style={[styles.filterRow, { borderColor: colors.border }]}>
        {(["all", "unpaid", "paid", "overdue"] as TFilter[]).map((f) => (
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

      <OdooList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={80}
        emptyTitle="No invoices"
        emptyMessage="No invoices match your filter."
      />
    </View>
  );
}

function InvoiceRow({ invoice }: { invoice: IInvoice }) {
  const { colors } = useTheme();
  const badge = PAYMENT_BADGE[invoice.payment_state] ?? PAYMENT_BADGE.not_paid;

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={() => router.push(`/(client)/invoices/${invoice.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {invoice.name}
        </Text>
        <Text style={[styles.rowDate, { color: colors.textMuted }]}>
          {invoice.invoice_date ? formatDate(invoice.invoice_date) : "No date"}
          {invoice.invoice_date_due && ` · Due ${formatDate(invoice.invoice_date_due)}`}
        </Text>
        <StatusBadge label={badge.label} variant={badge.variant} size="sm" />
      </View>

      <View style={styles.rowRight}>
        <Text style={[styles.amount, { color: colors.text }]}>
          ${invoice.amount_total.toLocaleString()}
        </Text>
        {invoice.amount_residual > 0 && invoice.amount_residual !== invoice.amount_total && (
          <Text style={[styles.residual, { color: colors.danger }]}>
            ${invoice.amount_residual.toLocaleString()} due
          </Text>
        )}
      </View>
    </TouchableOpacity>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  rowLeft: { flex: 1, marginRight: SPACING.md },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowDate: { fontSize: 12, marginTop: 2, marginBottom: SPACING.xs },
  rowRight: { alignItems: "flex-end" },
  amount: { fontSize: 16, fontWeight: "700" },
  residual: { fontSize: 12, fontWeight: "600", marginTop: 2 },
});
