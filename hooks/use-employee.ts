import { useOdooQuery, odooKeys } from "./use-odoo-query";
import { useOdooSearchRead, useOdooDetail } from "./use-odoo-search";
import { useOdooMutation, useOdooCreate, useOdooWrite } from "./use-odoo-mutation";
import { STALE_TIMES } from "../services/query-client";
import { useAuthStore } from "../stores/auth-store";

// --- Types ---

export interface IEmployeeTask {
  id: number;
  name: string;
  project_id: [number, string];
  stage_id: [number, string];
  priority: string;
  date_deadline: string | false;
  kanban_state: "normal" | "done" | "blocked";
  tag_ids: number[];
  description: string | false;
  create_date: string;
  write_date: string;
  effective_hours: number;
  planned_hours: number;
  remaining_hours: number;
  progress: number;
  parent_id: [number, string] | false;
  child_ids: number[];
  user_ids: Array<[number, string]>;
}

export interface ILeaveAllocation {
  id: number;
  holiday_status_id: [number, string];
  number_of_days: number;
  max_leaves: number;
  leaves_taken: number;
  remaining_leaves: number;
  state: string;
}

export interface ILeaveRequest {
  id: number;
  name: string;
  holiday_status_id: [number, string];
  date_from: string;
  date_to: string;
  number_of_days: number;
  state: "draft" | "confirm" | "validate1" | "validate" | "refuse";
  employee_id: [number, string];
}

export interface IPayslip {
  id: number;
  name: string;
  number: string;
  employee_id: [number, string];
  date_from: string;
  date_to: string;
  state: "draft" | "verify" | "done" | "cancel";
  net_wage: number;
  basic_wage: number;
  gross_wage: number;
  struct_id: [number, string] | false;
  company_id: [number, string];
}

export interface IAttendance {
  id: number;
  employee_id: [number, string];
  check_in: string;
  check_out: string | false;
  worked_hours: number;
}

export interface IEmployeeHomeSummary {
  tasksToday: number;
  tasksDue: number;
  hoursThisWeek: number;
  leaveBalance: number;
  isCheckedIn: boolean;
  lastCheckIn: string | null;
}

// --- Fields ---

const TASK_FIELDS = [
  "name", "project_id", "stage_id", "priority", "date_deadline",
  "kanban_state", "tag_ids", "description", "create_date", "write_date",
  "effective_hours", "planned_hours", "remaining_hours", "progress",
  "parent_id", "child_ids", "user_ids",
];

const LEAVE_REQUEST_FIELDS = [
  "name", "holiday_status_id", "date_from", "date_to",
  "number_of_days", "state", "employee_id",
];

const LEAVE_ALLOCATION_FIELDS = [
  "holiday_status_id", "number_of_days", "max_leaves",
  "leaves_taken", "remaining_leaves", "state",
];

const PAYSLIP_FIELDS = [
  "name", "number", "employee_id", "date_from", "date_to",
  "state", "net_wage", "basic_wage", "gross_wage",
  "struct_id", "company_id",
];

const ATTENDANCE_FIELDS = [
  "employee_id", "check_in", "check_out", "worked_hours",
];

// --- Hooks ---

export function useMyTasks(domain: unknown[] = []) {
  const uid = useAuthStore((s) => s.user?.uid);
  return useOdooSearchRead<IEmployeeTask>({
    model: "project.task",
    domain: [["user_ids", "in", [uid ?? 0]], ...domain],
    fields: TASK_FIELDS,
    order: "priority desc, date_deadline asc, id desc",
    limit: 100,
    staleTime: STALE_TIMES.LIST,
    enabled: !!uid,
  });
}

export function useMyTaskDetail(id: number) {
  return useOdooDetail<IEmployeeTask>({
    model: "project.task",
    id,
    fields: TASK_FIELDS,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useLeaveAllocations() {
  const uid = useAuthStore((s) => s.user?.uid);
  return useOdooSearchRead<ILeaveAllocation>({
    model: "hr.leave.allocation",
    domain: [["employee_id.user_id", "=", uid ?? 0], ["state", "=", "validate"]],
    fields: LEAVE_ALLOCATION_FIELDS,
    order: "id desc",
    limit: 20,
    staleTime: STALE_TIMES.LIST,
    enabled: !!uid,
  });
}

export function useLeaveRequests() {
  const uid = useAuthStore((s) => s.user?.uid);
  return useOdooSearchRead<ILeaveRequest>({
    model: "hr.leave",
    domain: [["employee_id.user_id", "=", uid ?? 0]],
    fields: LEAVE_REQUEST_FIELDS,
    order: "date_from desc",
    limit: 50,
    staleTime: STALE_TIMES.LIST,
    enabled: !!uid,
  });
}

export function useCreateLeaveRequest() {
  return useOdooCreate("hr.leave", {
    invalidateKeys: [odooKeys.model("hr.leave")],
  });
}

export function usePayslips() {
  const uid = useAuthStore((s) => s.user?.uid);
  return useOdooSearchRead<IPayslip>({
    model: "hr.payslip",
    domain: [["employee_id.user_id", "=", uid ?? 0], ["state", "=", "done"]],
    fields: PAYSLIP_FIELDS,
    order: "date_from desc",
    limit: 24,
    staleTime: STALE_TIMES.STATIC,
    enabled: !!uid,
  });
}

export function useAttendance() {
  const uid = useAuthStore((s) => s.user?.uid);
  return useOdooSearchRead<IAttendance>({
    model: "hr.attendance",
    domain: [["employee_id.user_id", "=", uid ?? 0]],
    fields: ATTENDANCE_FIELDS,
    order: "check_in desc",
    limit: 30,
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!uid,
  });
}

export function useCheckInOut() {
  return useOdooMutation<unknown, { args: unknown[]; kwargs?: Record<string, unknown> }>({
    model: "hr.employee",
    method: "attendance_manual",
    invalidateKeys: [odooKeys.model("hr.attendance")],
  });
}

export function useEmployeeHomeSummary() {
  return useOdooQuery<IEmployeeHomeSummary>({
    model: "res.users",
    method: "get_employee_dashboard",
    args: [],
    queryKey: odooKeys.custom("employee", "home_summary", []),
    staleTime: STALE_TIMES.DASHBOARD,
    select: (data) => {
      const d = data as IEmployeeHomeSummary;
      return {
        tasksToday: d.tasksToday ?? 0,
        tasksDue: d.tasksDue ?? 0,
        hoursThisWeek: d.hoursThisWeek ?? 0,
        leaveBalance: d.leaveBalance ?? 0,
        isCheckedIn: d.isCheckedIn ?? false,
        lastCheckIn: d.lastCheckIn ?? null,
      };
    },
  });
}

export function useUpdateMyTask() {
  return useOdooWrite("project.task", {
    invalidateKeys: [
      odooKeys.model("project.task"),
      odooKeys.custom("employee", "home_summary", []),
    ],
  });
}
