import { useOdooQuery, odooKeys } from "./use-odoo-query";
import { STALE_TIMES } from "../services/query-client";

// --- Types ---

export interface IDashboardKPI {
  revenue: number;
  revenueTrend: number;
  openOpportunities: number;
  wonDeals: number;
  openInvoices: number;
  overdueInvoices: number;
  activeProjects: number;
  tasksCompleted: number;
  tasksDue: number;
}

export interface IRevenuePoint {
  month: string;
  amount: number;
}

export interface IActivityItem {
  id: number;
  type: "crm" | "invoice" | "project" | "task";
  title: string;
  subtitle: string;
  date: string;
  userName: string;
}

export interface IPipelineStage {
  id: number;
  name: string;
  count: number;
  amount: number;
}

// --- Hooks ---

export function useDashboardKPIs() {
  return useOdooQuery<IDashboardKPI>({
    model: "res.users",
    method: "get_dashboard_kpis",
    args: [],
    queryKey: odooKeys.custom("dashboard", "kpis", []),
    staleTime: STALE_TIMES.DETAIL,
    select: (data) => {
      const d = data as IDashboardKPI;
      return {
        revenue: d.revenue ?? 0,
        revenueTrend: d.revenueTrend ?? 0,
        openOpportunities: d.openOpportunities ?? 0,
        wonDeals: d.wonDeals ?? 0,
        openInvoices: d.openInvoices ?? 0,
        overdueInvoices: d.overdueInvoices ?? 0,
        activeProjects: d.activeProjects ?? 0,
        tasksCompleted: d.tasksCompleted ?? 0,
        tasksDue: d.tasksDue ?? 0,
      };
    },
  });
}

export function useRevenueChart() {
  return useOdooQuery<IRevenuePoint[]>({
    model: "account.move",
    method: "get_monthly_revenue",
    args: [],
    queryKey: odooKeys.custom("dashboard", "revenue_chart", []),
    staleTime: STALE_TIMES.LIST,
    select: (data) => {
      const arr = data as IRevenuePoint[];
      return Array.isArray(arr)
        ? arr.map((p) => ({
            month: p.month ?? "",
            amount: p.amount ?? 0,
          }))
        : [];
    },
  });
}

export function usePipelineSummary() {
  return useOdooQuery<IPipelineStage[]>({
    model: "crm.stage",
    method: "get_pipeline_summary",
    args: [],
    queryKey: odooKeys.custom("dashboard", "pipeline", []),
    staleTime: STALE_TIMES.LIST,
    select: (data) => {
      const arr = data as IPipelineStage[];
      return Array.isArray(arr) ? arr : [];
    },
  });
}

export function useRecentActivity() {
  return useOdooQuery<IActivityItem[]>({
    model: "mail.activity",
    method: "get_recent_dashboard_activity",
    args: [],
    queryKey: odooKeys.custom("dashboard", "activity", []),
    staleTime: STALE_TIMES.DETAIL,
    select: (data) => {
      const arr = data as IActivityItem[];
      return Array.isArray(arr) ? arr : [];
    },
  });
}
