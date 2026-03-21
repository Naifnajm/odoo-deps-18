import { useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useOdooSearchRead,
  useOdooDetail,
} from "./use-odoo-search";
import { useOdooWrite } from "./use-odoo-mutation";
import { useOdooQuery, odooKeys } from "./use-odoo-query";
import { STALE_TIMES } from "../services/query-client";

// --- CRM Types ---

export interface ICrmStage {
  id: number;
  name: string;
  sequence: number;
  is_won: boolean;
  fold: boolean;
}

export interface ICrmLead {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  user_id: [number, string] | false;
  stage_id: [number, string];
  expected_revenue: number;
  probability: number;
  priority: string; // "0", "1", "2", "3"
  tag_ids: number[];
  activity_date_deadline: string | false;
  email_from: string | false;
  phone: string | false;
  city: string | false;
  country_id: [number, string] | false;
  type: "lead" | "opportunity";
  create_date: string;
  date_deadline: string | false;
  description: string | false;
  contact_name: string | false;
  partner_name: string | false;
  lost_reason_id: [number, string] | false;
  color: number;
}

export interface ICrmLeadDetail extends ICrmLead {
  street: string | false;
  street2: string | false;
  state_id: [number, string] | false;
  zip: string | false;
  website: string | false;
  function: string | false;
  title: [number, string] | false;
  mobile: string | false;
  date_open: string | false;
  date_closed: string | false;
  day_close: number;
  day_open: number;
  message_ids: number[];
  activity_ids: number[];
}

// --- Fields ---

const CRM_LIST_FIELDS = [
  "name",
  "partner_id",
  "user_id",
  "stage_id",
  "expected_revenue",
  "probability",
  "priority",
  "tag_ids",
  "activity_date_deadline",
  "email_from",
  "phone",
  "city",
  "country_id",
  "type",
  "create_date",
  "date_deadline",
  "contact_name",
  "partner_name",
  "color",
];

const CRM_DETAIL_FIELDS = [
  ...CRM_LIST_FIELDS,
  "description",
  "street",
  "street2",
  "state_id",
  "zip",
  "website",
  "function",
  "title",
  "mobile",
  "date_open",
  "date_closed",
  "day_close",
  "day_open",
  "lost_reason_id",
  "message_ids",
  "activity_ids",
];

// --- Hooks ---

export function useCrmStages() {
  return useOdooSearchRead<ICrmStage>({
    model: "crm.stage",
    domain: [],
    fields: ["name", "sequence", "is_won", "fold"],
    order: "sequence asc",
    limit: 20,
    staleTime: STALE_TIMES.STATIC,
  });
}

export function useCrmLeads(domain: unknown[] = []) {
  return useOdooSearchRead<ICrmLead>({
    model: "crm.lead",
    domain: [["type", "=", "opportunity"], ...domain],
    fields: CRM_LIST_FIELDS,
    order: "priority desc, create_date desc",
    limit: 200,
    staleTime: STALE_TIMES.LIST,
  });
}

export function useCrmLeadDetail(id: number) {
  return useOdooDetail<ICrmLeadDetail>({
    model: "crm.lead",
    id,
    fields: CRM_DETAIL_FIELDS,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useCrmPipeline(domain: unknown[] = []) {
  const stages = useCrmStages();
  const leads = useCrmLeads(domain);

  const pipeline = useMemo(() => {
    if (!stages.data?.records || !leads.data?.records) return [];

    return stages.data.records.map((stage) => ({
      id: stage.id,
      title: stage.name,
      count: 0,
      totalRevenue: 0,
      isWon: stage.is_won,
      items: [] as ICrmLead[],
    })).map((column) => {
      const stageLeads = leads.data!.records.filter(
        (lead) => lead.stage_id[0] === column.id
      );
      return {
        ...column,
        count: stageLeads.length,
        totalRevenue: stageLeads.reduce((sum, l) => sum + l.expected_revenue, 0),
        items: stageLeads,
      };
    });
  }, [stages.data, leads.data]);

  return {
    pipeline,
    stages: stages.data?.records ?? [],
    leads: leads.data?.records ?? [],
    isLoading: stages.isLoading || leads.isLoading,
    isError: stages.isError || leads.isError,
    isRefetching: stages.isRefetching || leads.isRefetching,
  };
}

export function useMoveLeadStage() {
  return useOdooWrite("crm.lead", {
    invalidateKeys: [
      odooKeys.model("crm.lead"),
      odooKeys.custom("dashboard", "pipeline", []),
      odooKeys.custom("dashboard", "kpis", []),
    ],
  });
}

export function useUpdateLead() {
  return useOdooWrite("crm.lead", {
    invalidateKeys: [odooKeys.model("crm.lead")],
  });
}
