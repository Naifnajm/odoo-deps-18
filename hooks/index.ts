export { useOdooQuery, odooKeys } from "./use-odoo-query";
export { useOdooSearchRead, useOdooInfiniteList, useOdooDetail } from "./use-odoo-search";
export {
  useOdooMutation,
  useOdooCreate,
  useOdooWrite,
  useOdooDelete,
} from "./use-odoo-mutation";
export { useRoleRedirect, useAuthGuard } from "./use-role-redirect";
export {
  useDashboardKPIs,
  useRevenueChart,
  usePipelineSummary,
  useRecentActivity,
} from "./use-dashboard-data";
export {
  useCrmStages,
  useCrmLeads,
  useCrmLeadDetail,
  useCrmPipeline,
  useMoveLeadStage,
  useUpdateLead,
} from "./use-crm";
export {
  useProjects,
  useProjectDetail,
  useProjectTasks,
  useUpdateProject,
  useUpdateTask,
} from "./use-projects";
export {
  useInvoices,
  useInvoiceDetail,
  useInvoiceLines,
  useConfirmInvoice,
  useRegisterPayment,
} from "./use-invoices";
export {
  useMyTasks,
  useMyTaskDetail,
  useLeaveAllocations,
  useLeaveRequests,
  useCreateLeaveRequest,
  usePayslips,
  useAttendance,
  useCheckInOut,
  useEmployeeHomeSummary,
  useUpdateMyTask,
} from "./use-employee";
export {
  useClientTickets,
  useClientTicketDetail,
  useCreateTicket,
  useClientDocuments,
  useClientPortalSummary,
} from "./use-client-portal";
export { useOdooApps, ODOO_APP_CATEGORIES } from "./use-odoo-apps";
export { useNotifications } from "./use-notifications";
