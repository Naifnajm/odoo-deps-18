import type { TUserRole } from "../types/odoo";

export interface ITabConfig {
  name: string;
  title: string;
  icon: string;
  iconFocused: string;
}

export const ADMIN_TABS: ITabConfig[] = [
  { name: "dashboard", title: "nav.dashboard", icon: "grid-outline", iconFocused: "grid" },
  { name: "crm", title: "nav.crm", icon: "people-outline", iconFocused: "people" },
  { name: "projects", title: "nav.projects", icon: "folder-outline", iconFocused: "folder" },
  { name: "invoices", title: "nav.invoices", icon: "receipt-outline", iconFocused: "receipt" },
  { name: "settings", title: "nav.settings", icon: "settings-outline", iconFocused: "settings" },
];

export const EMPLOYEE_TABS: ITabConfig[] = [
  { name: "home", title: "nav.home", icon: "home-outline", iconFocused: "home" },
  { name: "tasks", title: "nav.tasks", icon: "checkbox-outline", iconFocused: "checkbox" },
  { name: "projects", title: "nav.projects", icon: "folder-outline", iconFocused: "folder" },
  { name: "hr", title: "nav.hr", icon: "briefcase-outline", iconFocused: "briefcase" },
  { name: "settings", title: "nav.settings", icon: "settings-outline", iconFocused: "settings" },
];

export const CLIENT_TABS: ITabConfig[] = [
  { name: "projects", title: "nav.projects", icon: "folder-outline", iconFocused: "folder" },
  { name: "invoices", title: "nav.invoices", icon: "receipt-outline", iconFocused: "receipt" },
  { name: "support", title: "nav.support", icon: "chatbubble-outline", iconFocused: "chatbubble" },
  { name: "documents", title: "nav.documents", icon: "document-outline", iconFocused: "document" },
  { name: "profile", title: "nav.profile", icon: "person-outline", iconFocused: "person" },
];

export const ROLE_INITIAL_ROUTE: Record<TUserRole, string> = {
  admin: "/(admin)/dashboard",
  employee: "/(employee)/home",
  client: "/(client)/projects",
};

export const ROLE_GROUP: Record<TUserRole, string> = {
  admin: "(admin)",
  employee: "(employee)",
  client: "(client)",
};
