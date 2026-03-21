import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import {
  useInvoiceDetail,
  useInvoiceLines,
  useConfirmInvoice,
  type IInvoiceLine,
} from "../../../hooks/use-invoices";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { KPICard } from "../../../components/kpi-card";
import { SkeletonGroup } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";

export default function AdminInvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = Number(id) || 0;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: invoice, isLoading, isError, refetch } = useInvoiceDetail(invoiceId);
  const lines = useInvoiceLines(invoice?.invoice_line_ids ?? []);
  const confirmInvoice = useConfirmInvoice();

  const handleConfirm = useCallback(() => {
    if (!invoice || invoice.state !== "draft") return;
    Alert.alert("Confirm Invoice", "This will post the invoice. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () =>
          confirmInvoice.mutate(
            { args: [[invoiceId]] },
            {
              onSuccess: () => refetch(),
              onError: () => Alert.alert("Error", "Failed to confirm invoice."),
            }
          ),
      },
    ]);
  }, [invoice, invoiceId, confirmInvoice, refetch]);

  const handleShare = useCallback(async () => {
    if (!invoice) return;
    await Share.share({
      message: `Invoice ${invoice.name}\nAmount: ${formatCurrency(invoice.amount_total)}\nStatus: ${invoice.state}`,
    });
  }, [invoice]);

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
        <SkeletonGroup count={6} style={{ padding: SPACING.xl }} />
      </View>
    );
  }

  const stateLabel = getStateLabel(invoice.state, invoice.payment_state);
  const stateVariant = getStateVariant(invoice.state, invoice.payment_state);
  const isOverdue =
    invoice.state === "posted" &&
    invoice.payment_state !== "paid" &&
    invoice.invoice_date_due &&
    new Date(invoice.invoice_date_due) < new Date();
  const isRefund = invoice.move_type === "out_refund";

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={invoice.name}
        subtitle={invoice.partner_id ? invoice.partner_id[1] : undefined}
        showBack
        rightAction={
          <TouchableOpacity onPress={handleShare} activeOpacity={0.7}>
            <Text style={[styles.shareText, { color: colors.blue }]}>Share</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badges */}
        <View style={styles.badgeRow}>
          <StatusBadge label={stateLabel} variant={stateVariant} />
          {isOverdue && <StatusBadge label="Overdue" variant="danger" />}
          {isRefund && <StatusBadge label="Credit Note" variant="warning" />}
        </View>

        {/* Amount Cards */}
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
            trend={invoice.amount_residual > 0 ? "down" : "up"}
            trendValue={invoice.amount_residual > 0 ? "unpaid" : "settled"}
            style={styles.kpiCard}
          />
        </View>

        {/* Tax & Untaxed */}
        <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AmountRow label="Untaxed Amount" value={invoice.amount_untaxed} colors={colors} />
          <AmountRow label="Tax" value={invoice.amount_tax} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <AmountRow label="Total" value={invoice.amount_total} colors={colors} bold />
          {invoice.amount_residual > 0 && invoice.amount_residual !== invoice.amount_total && (
            <AmountRow label="Amount Paid" value={invoice.amount_total - invoice.amount_residual} colors={colors} />
          )}
        </View>

        {/* Invoice Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <InfoRow label="Invoice Date" value={formatDate(invoice.invoice_date)} colors={colors} />
          {invoice.invoice_date_due && (
            <InfoRow
              label="Due Date"
              value={formatDate(invoice.invoice_date_due)}
              colors={colors}
              highlight={isOverdue}
            />
          )}
          {invoice.invoice_payment_term_id && (
            <InfoRow label="Payment Terms" value={invoice.invoice_payment_term_id[1]} colors={colors} />
          )}
          {invoice.invoice_origin && (
            <InfoRow label="Source" value={invoice.invoice_origin} colors={colors} />
          )}
          {invoice.ref && (
            <InfoRow label="Reference" value={invoice.ref} colors={colors} />
          )}
          <InfoRow label="Journal" value={invoice.journal_id[1]} colors={colors} />
          {invoice.invoice_user_id && (
            <InfoRow label="Salesperson" value={invoice.invoice_user_id[1]} colors={colors} />
          )}
          <InfoRow label="Currency" value={invoice.currency_id[1]} colors={colors} />
        </View>

        {/* Invoice Lines */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Lines ({lines.data?.records?.length ?? 0})
          </Text>
          {lines.isLoading ? (
            <SkeletonGroup count={3} itemHeight={50} />
          ) : (
            (lines.data?.records ?? []).map((line) => (
              <InvoiceLineRow key={line.id} line={line} colors={colors} />
            ))
          )}
        </View>

        {/* Notes */}
        {invoice.narration && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              {stripHtml(invoice.narration)}
            </Text>
          </View>
        )}

        {/* Actions */}
        {invoice.state === "draft" && (
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.gold }]}
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmText}>Confirm Invoice</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// --- Sub-components ---

function AmountRow({
  label,
  value,
  colors,
  bold = false,
}: {
  label: string;
  value: number;
  colors: Record<string, string>;
  bold?: boolean;
}) {
  return (
    <View style={styles.amountRow}>
      <Text
        style={[
          styles.amountLabel,
          { color: colors.textMuted, fontWeight: bold ? "700" : "500" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.amountValue,
          { color: colors.text, fontWeight: bold ? "700" : "600" },
        ]}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
  highlight = false,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          { color: highlight ? colors.danger : colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function InvoiceLineRow({
  line,
  colors,
}: {
  line: IInvoiceLine;
  colors: Record<string, string>;
}) {
  return (
    <View style={[styles.lineRow, { borderColor: colors.border }]}>
      <View style={styles.lineLeft}>
        <Text style={[styles.lineName, { color: colors.text }]} numberOfLines={2}>
          {line.product_id ? line.product_id[1] : line.name}
        </Text>
        <Text style={[styles.lineDetail, { color: colors.textMuted }]}>
          {line.quantity} × {formatCurrency(line.price_unit)}
          {line.discount > 0 ? ` (-${line.discount}%)` : ""}
        </Text>
      </View>
      <Text style={[styles.lineTotal, { color: colors.text }]}>
        {formatCurrency(line.price_subtotal)}
      </Text>
    </View>
  );
}

// --- Helpers ---

function getStateLabel(state: string, paymentState: string): string {
  if (paymentState === "paid") return "Paid";
  if (paymentState === "partial") return "Partial";
  if (paymentState === "in_payment") return "In Payment";
  if (state === "draft") return "Draft";
  if (state === "posted") return "Open";
  if (state === "cancel") return "Cancelled";
  return state;
}

function getStateVariant(state: string, paymentState: string) {
  if (paymentState === "paid") return "success" as const;
  if (paymentState === "partial") return "warning" as const;
  if (state === "draft") return "neutral" as const;
  if (state === "posted") return "info" as const;
  if (state === "cancel") return "danger" as const;
  return "neutral" as const;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | false): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

// --- Styles ---

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },
  shareText: { fontSize: 14, fontWeight: "700" },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  kpiRow: { flexDirection: "row", gap: SPACING.md, marginBottom: SPACING.md },
  kpiCard: { flex: 1 },

  amountCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  amountLabel: { fontSize: 14 },
  amountValue: { fontSize: 14 },
  divider: { height: 1, marginVertical: SPACING.sm },

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
  infoValue: { fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },

  lineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  lineLeft: { flex: 1 },
  lineName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  lineDetail: { fontSize: 12 },
  lineTotal: { fontSize: 15, fontWeight: "700" },

  noteText: { fontSize: 14, lineHeight: 20 },

  confirmButton: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  confirmText: { fontSize: 16, fontWeight: "700", color: "#080C14" },
});
