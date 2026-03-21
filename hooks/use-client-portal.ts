import { useOdooSearchRead, useOdooDetail } from "./use-odoo-search";
import { useOdooQuery, odooKeys } from "./use-odoo-query";
import { useOdooCreate } from "./use-odoo-mutation";
import { STALE_TIMES } from "../services/query-client";
import { useAuthStore } from "../stores/auth-store";

// --- Types ---

export interface IClientTicket {
  id: number;
  name: string;
  description: string | false;
  partner_id: [number, string] | false;
  stage_id: [number, string];
  priority: string;
  kanban_state: "normal" | "done" | "blocked";
  create_date: string;
  write_date: string;
  user_id: [number, string] | false;
  team_id: [number, string] | false;
  tag_ids: number[];
  sla_deadline: string | false;
  assign_date: string | false;
  close_date: string | false;
}

export interface IClientDocument {
  id: number;
  name: string;
  datas_fname: string | false;
  mimetype: string;
  file_size: number;
  create_date: string;
  write_date: string;
  res_model: string | false;
  res_id: number;
  type: "binary" | "url";
  url: string | false;
  description: string | false;
  partner_id: [number, string] | false;
}

export interface IClientPortalSummary {
  invoiceCount: number;
  invoiceUnpaid: number;
  invoiceTotal: number;
  projectCount: number;
  ticketOpen: number;
  documentCount: number;
}

// --- Fields ---

const TICKET_FIELDS = [
  "name", "description", "partner_id", "stage_id", "priority",
  "kanban_state", "create_date", "write_date", "user_id", "team_id",
  "tag_ids", "sla_deadline", "assign_date", "close_date",
];

const DOCUMENT_FIELDS = [
  "name", "datas_fname", "mimetype", "file_size", "create_date",
  "write_date", "res_model", "res_id", "type", "url",
  "description", "partner_id",
];

// --- Hooks ---

export function useClientTickets(domain: unknown[] = []) {
  const partnerId = useAuthStore((s: any) => s.user?.partnerId);
  return useOdooSearchRead<IClientTicket>({
    model: "helpdesk.ticket",
    domain: [["partner_id", "=", partnerId ?? 0], ...domain],
    fields: TICKET_FIELDS,
    order: "create_date desc",
    limit: 50,
    staleTime: STALE_TIMES.LIST,
    enabled: !!partnerId,
  });
}

export function useClientTicketDetail(id: number) {
  return useOdooDetail<IClientTicket>({
    model: "helpdesk.ticket",
    id,
    fields: TICKET_FIELDS,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useCreateTicket() {
  return useOdooCreate("helpdesk.ticket", {
    invalidateKeys: [odooKeys.model("helpdesk.ticket")],
  });
}

export function useClientDocuments() {
  const partnerId = useAuthStore((s: any) => s.user?.partnerId);
  return useOdooSearchRead<IClientDocument>({
    model: "ir.attachment",
    domain: [["partner_id", "=", partnerId ?? 0], ["res_model", "!=", false]],
    fields: DOCUMENT_FIELDS,
    order: "create_date desc",
    limit: 100,
    staleTime: STALE_TIMES.LIST,
    enabled: !!partnerId,
  });
}

export function useClientPortalSummary() {
  return useOdooQuery<IClientPortalSummary>({
    model: "res.partner",
    method: "get_portal_summary",
    args: [],
    queryKey: odooKeys.custom("client", "portal_summary", []),
    staleTime: STALE_TIMES.DASHBOARD,
    select: (data) => {
      const d = data as IClientPortalSummary;
      return {
        invoiceCount: d.invoiceCount ?? 0,
        invoiceUnpaid: d.invoiceUnpaid ?? 0,
        invoiceTotal: d.invoiceTotal ?? 0,
        projectCount: d.projectCount ?? 0,
        ticketOpen: d.ticketOpen ?? 0,
        documentCount: d.documentCount ?? 0,
      };
    },
  });
}
