import { useMemo } from "react";
import { useOdooSearchRead, useOdooDetail } from "./use-odoo-search";
import { useOdooWrite } from "./use-odoo-mutation";
import { odooKeys } from "./use-odoo-query";
import { STALE_TIMES } from "../services/query-client";

// --- Types ---

export interface IProject {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  user_id: [number, string] | false;
  date_start: string | false;
  date: string | false;
  task_count: number;
  open_task_count: number;
  color: number;
  stage_id: [number, string] | false;
  tag_ids: number[];
  description: string | false;
  label_tasks: string;
  is_favorite: boolean;
  last_update_status: string;
  last_update_color: number;
}

export interface IProjectDetail extends IProject {
  analytic_account_id: [number, string] | false;
  allow_timesheets: boolean;
  allow_milestones: boolean;
  company_id: [number, string];
  create_date: string;
  write_date: string;
  message_ids: number[];
  rating_avg: number;
  rating_count: number;
}

export interface IProjectTask {
  id: number;
  name: string;
  project_id: [number, string];
  user_ids: Array<[number, string]>;
  stage_id: [number, string];
  priority: string;
  date_deadline: string | false;
  kanban_state: "normal" | "done" | "blocked";
  state: string;
  tag_ids: number[];
  description: string | false;
  create_date: string;
  write_date: string;
  parent_id: [number, string] | false;
  child_ids: number[];
  timesheet_ids: number[];
  effective_hours: number;
  planned_hours: number;
  remaining_hours: number;
  progress: number;
}

// --- Fields ---

const PROJECT_LIST_FIELDS = [
  "name", "partner_id", "user_id", "date_start", "date",
  "task_count", "open_task_count", "color", "stage_id",
  "tag_ids", "label_tasks", "is_favorite",
  "last_update_status", "last_update_color",
];

const PROJECT_DETAIL_FIELDS = [
  ...PROJECT_LIST_FIELDS,
  "description", "analytic_account_id", "allow_timesheets",
  "allow_milestones", "company_id", "create_date", "write_date",
  "message_ids", "rating_avg", "rating_count",
];

const TASK_LIST_FIELDS = [
  "name", "project_id", "user_ids", "stage_id", "priority",
  "date_deadline", "kanban_state", "state", "tag_ids",
  "create_date", "write_date", "parent_id", "child_ids",
  "effective_hours", "planned_hours", "remaining_hours", "progress",
];

// --- Hooks ---

export function useProjects(domain: unknown[] = []) {
  return useOdooSearchRead<IProject>({
    model: "project.project",
    domain,
    fields: PROJECT_LIST_FIELDS,
    order: "is_favorite desc, name asc",
    limit: 80,
    staleTime: STALE_TIMES.LIST,
  });
}

export function useProjectDetail(id: number) {
  return useOdooDetail<IProjectDetail>({
    model: "project.project",
    id,
    fields: PROJECT_DETAIL_FIELDS,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useProjectTasks(projectId: number, domain: unknown[] = []) {
  return useOdooSearchRead<IProjectTask>({
    model: "project.task",
    domain: [["project_id", "=", projectId], ...domain],
    fields: TASK_LIST_FIELDS,
    order: "priority desc, date_deadline asc, id desc",
    limit: 200,
    staleTime: STALE_TIMES.LIST,
    enabled: projectId > 0,
  });
}

export function useUpdateProject() {
  return useOdooWrite("project.project", {
    invalidateKeys: [odooKeys.model("project.project")],
  });
}

export function useUpdateTask() {
  return useOdooWrite("project.task", {
    invalidateKeys: [
      odooKeys.model("project.task"),
      odooKeys.model("project.project"),
    ],
  });
}
