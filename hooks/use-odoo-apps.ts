import { useQuery } from "@tanstack/react-query";
import { odooRpc } from "../services/odoo-rpc";
import { STALE_TIMES } from "../services/query-client";

export interface IOdooApp {
  id: number;
  name: string;
  technicalName: string;
  icon: string;
  category: string;
  menuId: number;
}

// Category definitions with icons
export const ODOO_APP_CATEGORIES = [
  { key: "sales", label: "Sales", icon: "\uD83D\uDCB0" },
  { key: "accounting", label: "Accounting", icon: "\uD83D\uDCCA" },
  { key: "inventory", label: "Inventory", icon: "\uD83D\uDCE6" },
  { key: "hr", label: "HR", icon: "\uD83D\uDC65" },
  { key: "project", label: "Project", icon: "\uD83D\uDCCB" },
  { key: "website", label: "Website", icon: "\uD83C\uDF10" },
  { key: "marketing", label: "Marketing", icon: "\uD83D\uDCE3" },
  { key: "other", label: "Other", icon: "\uD83D\uDD27" },
] as const;

// Map Odoo module names to emoji icons
const MODULE_ICONS: Record<string, string> = {
  sale: "\uD83D\uDCB0",
  sale_management: "\uD83D\uDCB0",
  purchase: "\uD83D\uDED2",
  stock: "\uD83D\uDCE6",
  account: "\uD83D\uDCCA",
  account_accountant: "\uD83D\uDCCA",
  crm: "\uD83E\uDD1D",
  project: "\uD83D\uDCCB",
  hr: "\uD83D\uDC65",
  hr_holidays: "\uD83C\uDFD6\uFE0F",
  hr_expense: "\uD83D\uDCB3",
  hr_recruitment: "\uD83D\uDD0D",
  hr_attendance: "\u23F0",
  hr_payroll: "\uD83D\uDCB5",
  hr_timesheet: "\u23F1\uFE0F",
  helpdesk: "\uD83C\uDFAB",
  website: "\uD83C\uDF10",
  website_sale: "\uD83D\uDED2",
  point_of_sale: "\uD83D\uDED2",
  pos_restaurant: "\uD83C\uDF7D\uFE0F",
  mrp: "\uD83C\uDFED",
  maintenance: "\uD83D\uDD27",
  fleet: "\uD83D\uDE97",
  lunch: "\uD83C\uDF54",
  calendar: "\uD83D\uDCC5",
  contacts: "\uD83D\uDCD6",
  mail: "\u2709\uFE0F",
  discuss: "\uD83D\uDCAC",
  survey: "\uD83D\uDCDD",
  sign: "\u270D\uFE0F",
  documents: "\uD83D\uDCC1",
  knowledge: "\uD83D\uDCDA",
  planning: "\uD83D\uDCC6",
  quality: "\u2705",
  approvals: "\uD83D\uDC4D",
  social: "\uD83D\uDCF1",
  events: "\uD83C\uDFAA",
  event: "\uD83C\uDFAA",
  mass_mailing: "\uD83D\uDCE7",
  marketing_automation: "\uD83E\uDD16",
  livechat: "\uD83D\uDCAC",
  im_livechat: "\uD83D\uDCAC",
  note: "\uD83D\uDDD2\uFE0F",
  to_do: "\u2611\uFE0F",
  spreadsheet: "\uD83D\uDCC8",
  studio: "\uD83C\uDFA8",
  voip: "\uD83D\uDCDE",
  whatsapp: "\uD83D\uDCAC",
  rental: "\uD83D\uDD11",
  subscription: "\uD83D\uDD04",
};

// Map category name keywords to category keys
function categorizeModule(category: string, name: string): string {
  const cat = category.toLowerCase();
  const n = name.toLowerCase();

  if (cat.includes("sales") || n.includes("sale") || n === "crm") return "sales";
  if (cat.includes("account") || cat.includes("invoic") || n.includes("account")) return "accounting";
  if (cat.includes("inventory") || cat.includes("warehouse") || n.includes("stock") || n === "mrp") return "inventory";
  if (cat.includes("human") || n.includes("hr") || n.includes("employee") || n.includes("payroll") || n.includes("recruit")) return "hr";
  if (cat.includes("project") || n.includes("project") || n.includes("task") || n.includes("timesheet")) return "project";
  if (cat.includes("website") || n.includes("website")) return "website";
  if (cat.includes("marketing") || n.includes("marketing") || n.includes("mass_mail") || n.includes("social")) return "marketing";
  return "other";
}

function getModuleIcon(technicalName: string): string {
  // Try exact match
  if (MODULE_ICONS[technicalName]) return MODULE_ICONS[technicalName];

  // Try prefix match
  for (const [key, icon] of Object.entries(MODULE_ICONS)) {
    if (technicalName.startsWith(key)) return icon;
  }

  return "\uD83D\uDCE6"; // Default box icon
}

export function useOdooApps() {
  return useQuery<IOdooApp[]>({
    queryKey: ["odoo", "ir.module.module", "installed_apps"],
    queryFn: async () => {
      // Step 1: Fetch all installed modules that have a menu (i.e., are actual "apps")
      const menus = await odooRpc.callKw<
        Array<{
          id: number;
          name: string;
          action: string | false;
          web_icon: string | false;
        }>
      >({
        model: "ir.ui.menu",
        method: "search_read",
        args: [[["parent_id", "=", false]]],
        kwargs: {
          fields: ["name", "action", "web_icon"],
          order: "sequence",
        },
      });

      // Step 2: Fetch installed modules to map names/categories
      const modules = await odooRpc.callKw<
        Array<{
          id: number;
          name: string;
          shortdesc: string;
          category_id: [number, string] | false;
        }>
      >({
        model: "ir.module.module",
        method: "search_read",
        args: [[["state", "=", "installed"], ["application", "=", true]]],
        kwargs: {
          fields: ["name", "shortdesc", "category_id"],
        },
      });

      const moduleMap = new Map(
        modules.map((m) => [
          m.name,
          {
            shortdesc: m.shortdesc,
            category: Array.isArray(m.category_id) ? m.category_id[1] : "",
          },
        ])
      );

      // Build app list from top-level menus (these are the actual apps visible in Odoo)
      const apps: IOdooApp[] = menus
        .filter((menu) => {
          // Filter out Settings and other non-app menus
          const name = menu.name.toLowerCase();
          return name !== "settings" && menu.action;
        })
        .map((menu) => {
          // Extract action ID from action reference like "ir.actions.act_window,123"
          let menuId = 0;
          if (menu.action) {
            const parts = String(menu.action).split(",");
            menuId = parseInt(parts[parts.length - 1], 10) || menu.id;
          }

          // Try to find matching module for icon/category
          const menuNameLower = menu.name.toLowerCase().replace(/\s+/g, "_");
          const moduleInfo = moduleMap.get(menuNameLower);
          const category = moduleInfo
            ? categorizeModule(moduleInfo.category, menuNameLower)
            : "other";

          return {
            id: menu.id,
            name: menu.name,
            technicalName: menuNameLower,
            icon: getModuleIcon(menuNameLower),
            category,
            menuId,
          };
        });

      return apps;
    },
    staleTime: STALE_TIMES.STATIC,
  });
}
