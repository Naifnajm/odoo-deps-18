import { create } from "zustand";
import { odooRpc } from "../services/odoo-rpc";
import { secureStorage, cacheStorage } from "../utils/storage";
import { queryClient } from "../services/query-client";
import type {
  TUserRole,
  IUserProfile,
  IOdooAuthParams,
  IOdooSessionInfo,
} from "../types/odoo";

// Admin group identifiers in Odoo
const ADMIN_GROUPS = [
  "base.group_system",
  "base.group_erp_manager",
];

const EMPLOYEE_GROUPS = [
  "base.group_user",
];

const PORTAL_GROUPS = [
  "base.group_portal",
];

const detectRole = (groups: string[]): TUserRole => {
  const groupSet = new Set(groups);

  // Check admin first
  if (ADMIN_GROUPS.some((g) => groupSet.has(g))) {
    return "admin";
  }

  // Check employee (internal user)
  if (EMPLOYEE_GROUPS.some((g) => groupSet.has(g))) {
    return "employee";
  }

  // Check portal / client
  if (PORTAL_GROUPS.some((g) => groupSet.has(g))) {
    return "client";
  }

  // Default to client for external users
  return "client";
};

interface IAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IUserProfile | null;
  role: TUserRole | null;
  sessionChecked: boolean;
  error: string | null;

  login: (params: IOdooAuthParams) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  setUser: (user: IUserProfile) => void;
  clearError: () => void;
}

export const useAuthStore = create<IAuthState>((set: any) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  role: null,
  sessionChecked: false,
  error: null,

  login: async (params: IOdooAuthParams) => {
    set({ isLoading: true, error: null });

    try {
      // Authenticate with Odoo
      const session = await odooRpc.authenticate(params);

      // Fetch user groups for role detection
      const groups = await odooRpc.fetchUserGroups(session.uid);

      // Build user profile
      const profile = await buildUserProfile(session, groups);

      // Persist server config
      await secureStorage.setServerUrl(odooRpc.getBaseUrl());
      await secureStorage.setDatabase(params.db);

      // Check if remember me is on
      const rememberMe = await secureStorage.isRememberMe();
      if (rememberMe) {
        await secureStorage.setCredentials(params.login, params.password);
      }

      set({
        isAuthenticated: true,
        isLoading: false,
        user: profile,
        role: profile.role,
        sessionChecked: true,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        role: null,
        error: message,
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await odooRpc.logout();
    } catch {
      // Continue with local cleanup even if server logout fails
    }

    // Clear all local state
    queryClient.clear();
    cacheStorage.clearAll();
    await secureStorage.clearAll();

    set({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      role: null,
      sessionChecked: true,
      error: null,
    });
  },

  restoreSession: async () => {
    set({ isLoading: true });

    try {
      await odooRpc.initialize();

      if (!odooRpc.isConfigured() || !odooRpc.hasSession()) {
        set({ isLoading: false, sessionChecked: true });
        return false;
      }

      // Validate existing session
      const session = await odooRpc.checkSession();
      if (!session || !session.uid) {
        set({ isLoading: false, sessionChecked: true });
        return false;
      }

      // Fetch groups and build profile
      const groups = await odooRpc.fetchUserGroups(session.uid);
      const profile = await buildUserProfile(session, groups);

      set({
        isAuthenticated: true,
        isLoading: false,
        user: profile,
        role: profile.role,
        sessionChecked: true,
        error: null,
      });

      return true;
    } catch {
      set({
        isAuthenticated: false,
        isLoading: false,
        sessionChecked: true,
      });
      return false;
    }
  },

  setUser: (user: IUserProfile) => {
    set({ user, role: user.role });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// --- Helper: Build IUserProfile from session + groups ---

async function buildUserProfile(
  session: IOdooSessionInfo,
  groups: string[]
): Promise<IUserProfile> {
  const role = detectRole(groups);

  // Fetch additional user details
  let email = "";
  let phone = "";
  let companyName = "";
  let lang = "en_US";
  let tz = "UTC";

  try {
    const userDetails = await odooRpc.callKw<
      Array<{
        email: string;
        phone: string | false;
        company_id: [number, string];
        lang: string;
        tz: string | false;
      }>
    >({
      model: "res.users",
      method: "read",
      args: [[session.uid]],
      kwargs: {
        fields: ["email", "phone", "company_id", "lang", "tz"],
      },
    });

    if (userDetails.length > 0) {
      const details = userDetails[0];
      email = details.email || "";
      phone = details.phone || "";
      companyName = Array.isArray(details.company_id)
        ? details.company_id[1]
        : "";
      lang = details.lang || "en_US";
      tz = details.tz || "UTC";
    }
  } catch {
    // Non-critical; continue with defaults
  }

  return {
    uid: session.uid,
    name: session.name,
    login: session.username,
    email,
    phone,
    partnerId: session.partner_id,
    companyId: session.company_id,
    companyName,
    avatarUrl: odooRpc.getAvatarUrl("res.users", session.uid, "avatar_128"),
    role,
    lang,
    tz,
    groups,
    serverVersion: session.server_version,
  };
}

// --- Selectors ---

export const selectIsAdmin = (state: IAuthState): boolean =>
  state.role === "admin";

export const selectIsEmployee = (state: IAuthState): boolean =>
  state.role === "employee";

export const selectIsClient = (state: IAuthState): boolean =>
  state.role === "client";

export const selectCanAccessModule = (
  state: IAuthState,
  module: "crm" | "projects" | "invoices" | "hr" | "reports" | "support" | "documents"
): boolean => {
  const { role } = state;
  if (!role) return false;

  const ACCESS_MAP: Record<string, TUserRole[]> = {
    crm: ["admin"],
    projects: ["admin", "employee", "client"],
    invoices: ["admin", "client"],
    hr: ["employee"],
    reports: ["admin"],
    support: ["client"],
    documents: ["client"],
  };

  return ACCESS_MAP[module]?.includes(role) ?? false;
};
