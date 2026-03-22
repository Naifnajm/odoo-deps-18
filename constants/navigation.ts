import type { TUserRole } from "../types/odoo";

export interface ITabConfig {
  name: string;
  title: string;
  icon: string;
  iconFocused: string;
}

export const MAIN_TABS: ITabConfig[] = [
  { name: "home", title: "nav.home", icon: "home-outline", iconFocused: "home" },
  { name: "apps", title: "nav.apps", icon: "grid-outline", iconFocused: "grid" },
  { name: "notifications", title: "nav.inbox", icon: "mail-outline", iconFocused: "mail" },
  { name: "settings", title: "nav.settings", icon: "settings-outline", iconFocused: "settings" },
];

// All roles now redirect to the same main layout
export const ROLE_INITIAL_ROUTE: Record<TUserRole, string> = {
  admin: "/(main)/home",
  employee: "/(main)/home",
  client: "/(main)/home",
};

export const MAIN_ROUTE = "/(main)/home";
