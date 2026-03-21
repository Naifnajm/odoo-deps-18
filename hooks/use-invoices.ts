import { useOdooSearchRead, useOdooDetail } from "./use-odoo-search";
import { useOdooWrite } from "./use-odoo-mutation";
import { useOdooMutation } from "./use-odoo-mutation";
import { odooKeys } from "./use-odoo-query";
import { STALE_TIMES } from "../services/query-client";

// --- Types ---

export type TInvoiceState = "draft" | "posted" | "cancel";
export type TPaymentState = "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
export type TMoveType = "out_invoice" | "out_refund" | "in_invoice" | "in_refund" | "entry";

export interface IInvoice {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  move_type: TMoveType;
  state: TInvoiceState;
  payment_state: TPaymentState;
  invoice_date: string | false;
  invoice_date_due: string | false;
  amount_total: number;
  amount_residual: number;
  amount_untaxed: number;
  amount_tax: number;
  currency_id: [number, string];
  invoice_user_id: [number, string] | false;
  ref: string | false;
  narration: string | false;
  create_date: string;
}

export interface IInvoiceDetail extends IInvoice {
  invoice_line_ids: number[];
  company_id: [number, string];
  journal_id: [number, string];
  fiscal_position_id: [number, string] | false;
  invoice_payment_term_id: [number, string] | false;
  invoice_origin: string | false;
  write_date: string;
  message_ids: number[];
  amount_paid: number;
}

export interface IInvoiceLine {
  id: number;
  name: string;
  product_id: [number, string] | false;
  quantity: number;
  price_unit: number;
  discount: number;
  price_subtotal: number;
  price_total: number;
  tax_ids: number[];
  product_uom_id: [number, string] | false;
}

// --- Fields ---

const INVOICE_LIST_FIELDS = [
  "name", "partner_id", "move_type", "state", "payment_state",
  "invoice_date", "invoice_date_due", "amount_total", "amount_residual",
  "amount_untaxed", "amount_tax", "currency_id", "invoice_user_id",
  "ref", "create_date",
];

const INVOICE_DETAIL_FIELDS = [
  ...INVOICE_LIST_FIELDS,
  "narration", "invoice_line_ids", "company_id", "journal_id",
  "fiscal_position_id", "invoice_payment_term_id", "invoice_origin",
  "write_date", "message_ids", "amount_paid",
];

const INVOICE_LINE_FIELDS = [
  "name", "product_id", "quantity", "price_unit",
  "discount", "price_subtotal", "price_total",
  "tax_ids", "product_uom_id",
];

// --- Hooks ---

export function useInvoices(domain: unknown[] = []) {
  return useOdooSearchRead<IInvoice>({
    model: "account.move",
    domain: [["move_type", "in", ["out_invoice", "out_refund"]], ...domain],
    fields: INVOICE_LIST_FIELDS,
    order: "invoice_date desc, id desc",
    limit: 80,
    staleTime: STALE_TIMES.LIST,
  });
}

export function useInvoiceDetail(id: number) {
  return useOdooDetail<IInvoiceDetail>({
    model: "account.move",
    id,
    fields: INVOICE_DETAIL_FIELDS,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useInvoiceLines(lineIds: number[]) {
  return useOdooSearchRead<IInvoiceLine>({
    model: "account.move.line",
    domain: [["id", "in", lineIds]],
    fields: INVOICE_LINE_FIELDS,
    order: "sequence asc, id asc",
    limit: 100,
    enabled: lineIds.length > 0,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useConfirmInvoice() {
  return useOdooMutation<boolean, { args: unknown[]; kwargs?: Record<string, unknown> }>(
    {
      model: "account.move",
      method: "action_post",
      invalidateKeys: [
        odooKeys.model("account.move"),
        odooKeys.custom("dashboard", "kpis", []),
      ],
    }
  );
}

export function useRegisterPayment() {
  return useOdooMutation<unknown, { args: unknown[]; kwargs?: Record<string, unknown> }>(
    {
      model: "account.payment.register",
      method: "action_create_payments",
      invalidateKeys: [
        odooKeys.model("account.move"),
        odooKeys.custom("dashboard", "kpis", []),
      ],
    }
  );
}
