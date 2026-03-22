import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { secureStorage, cacheStorage } from "../utils/storage";
import type {
  IOdooAuthParams,
  IOdooAuthResponse,
  IOdooRpcParams,
  IOdooRpcResponse,
  IOdooRpcError,
  IOdooSearchReadParams,
  IOdooSearchReadResult,
  IOdooPaginatedResult,
  IOdooDatabaseListResponse,
  IOdooSessionInfo,
} from "../types/odoo";

const JSON_RPC_HEADERS = {
  "Content-Type": "application/json",
};

let rpcRequestId = 0;
const getNextId = (): number => ++rpcRequestId;

class OdooRpcError extends Error {
  code: number;
  data: IOdooRpcError["data"];

  constructor(error: IOdooRpcError) {
    super(error.message);
    this.name = "OdooRpcError";
    this.code = error.code;
    this.data = error.data;
  }
}

class OdooRpcService {
  private client: AxiosInstance;
  private baseUrl: string = "";
  private sessionId: string = "";

  constructor() {
    this.client = axios.create({
      headers: JSON_RPC_HEADERS,
      timeout: 30000,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor: attach session cookie
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.sessionId) {
          config.headers.set("Cookie", `session_id=${this.sessionId}`);
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor: extract session cookie, handle errors
    this.client.interceptors.response.use(
      (response: any) => {
        const setCookie = response.headers["set-cookie"];
        if (setCookie) {
          const sessionMatch = Array.isArray(setCookie)
            ? setCookie.join(";").match(/session_id=([^;]+)/)
            : String(setCookie).match(/session_id=([^;]+)/);
          if (sessionMatch?.[1]) {
            this.sessionId = sessionMatch[1];
            secureStorage.setSessionId(this.sessionId).catch(() => {});
          }
        }
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.sessionId = "";
          secureStorage.remove("odoo_session_id").catch(() => {});
        }
        return Promise.reject(error);
      }
    );
  }

  async initialize(): Promise<void> {
    const url = await secureStorage.getServerUrl();
    const sessionId = await secureStorage.getSessionId();
    if (url) {
      this.setBaseUrl(url);
    }
    if (sessionId) {
      this.sessionId = sessionId;
    }
  }

  setBaseUrl(url: string): void {
    const normalized = url.replace(/\/+$/, "");
    this.baseUrl = normalized;
    this.client.defaults.baseURL = normalized;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isConfigured(): boolean {
    return this.baseUrl.length > 0;
  }

  hasSession(): boolean {
    return this.sessionId.length > 0;
  }

  // --- Server Validation ---

  async pingServer(url: string): Promise<boolean> {
    try {
      const normalized = url.replace(/\/+$/, "");
      const response = await axios.get(`${normalized}/web/webclient/version_info`, {
        timeout: 10000,
        headers: JSON_RPC_HEADERS,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async fetchServerVersion(url: string): Promise<string | null> {
    try {
      const normalized = url.replace(/\/+$/, "");
      const response = await axios.post(
        `${normalized}/web/webclient/version_info`,
        { jsonrpc: "2.0", id: getNextId(), method: "call", params: {} },
        { timeout: 10000, headers: JSON_RPC_HEADERS }
      );
      return response.data?.result?.server_version ?? null;
    } catch {
      return null;
    }
  }

  // --- Database ---

  async fetchDatabases(url?: string): Promise<string[]> {
    const targetUrl = url ? url.replace(/\/+$/, "") : this.baseUrl;
    const response = await this.client.post<IOdooDatabaseListResponse>(
      `${targetUrl}/web/database/list`,
      {
        jsonrpc: "2.0",
        id: getNextId(),
        method: "call",
        params: {},
      }
    );

    if (response.data.error) {
      throw new OdooRpcError(response.data.error);
    }

    return response.data.result ?? [];
  }

  // --- Authentication ---

  async authenticate(params: IOdooAuthParams): Promise<IOdooSessionInfo> {
    const response = await this.client.post<IOdooAuthResponse>(
      "/web/session/authenticate",
      {
        jsonrpc: "2.0",
        id: getNextId(),
        method: "call",
        params: {
          db: params.db,
          login: params.login,
          password: params.password,
        },
      }
    );

    if (response.data.error) {
      throw new OdooRpcError(response.data.error);
    }

    const result = response.data.result;
    if (!result || !result.uid) {
      throw new Error("Authentication failed: invalid credentials");
    }

    this.sessionId = result.session_id;
    await secureStorage.setSessionId(result.session_id);

    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/web/session/destroy", {
        jsonrpc: "2.0",
        id: getNextId(),
        method: "call",
        params: {},
      });
    } catch {
      // Ignore logout errors
    } finally {
      this.sessionId = "";
      await secureStorage.clearAll();
      cacheStorage.clearAll();
    }
  }

  async checkSession(): Promise<IOdooSessionInfo | null> {
    try {
      const response = await this.client.post<IOdooAuthResponse>(
        "/web/session/get_session_info",
        {
          jsonrpc: "2.0",
          id: getNextId(),
          method: "call",
          params: {},
        }
      );

      const result = response.data.result;
      if (result?.uid) {
        return result;
      }
      return null;
    } catch {
      return null;
    }
  }

  // --- Generic RPC Call ---

  async callKw<T = unknown>(params: IOdooRpcParams): Promise<T> {
    const response = await this.client.post<IOdooRpcResponse<T>>(
      "/web/dataset/call_kw",
      {
        jsonrpc: "2.0",
        id: getNextId(),
        method: "call",
        params: {
          model: params.model,
          method: params.method,
          args: params.args,
          kwargs: params.kwargs ?? {},
        },
      }
    );

    if (response.data.error) {
      throw new OdooRpcError(response.data.error);
    }

    return response.data.result as T;
  }

  // --- Convenience Methods ---

  async searchRead<T = Record<string, unknown>>(
    params: IOdooSearchReadParams
  ): Promise<IOdooSearchReadResult<T>> {
    const result = await this.callKw<IOdooSearchReadResult<T>>({
      model: params.model,
      method: "search_read",
      args: [params.domain],
      kwargs: {
        fields: params.fields,
        limit: params.limit ?? 80,
        offset: params.offset ?? 0,
        order: params.order ?? "id desc",
        ...(params.context ? { context: params.context } : {}),
      },
    });

    return result;
  }

  async searchReadPaginated<T = Record<string, unknown>>(
    params: IOdooSearchReadParams
  ): Promise<IOdooPaginatedResult<T>> {
    const limit = params.limit ?? 40;
    const offset = params.offset ?? 0;

    const [records, total] = await Promise.all([
      this.searchRead<T>({ ...params, limit, offset }),
      this.callKw<number>({
        model: params.model,
        method: "search_count",
        args: [params.domain],
        kwargs: params.context ? { context: params.context } : {},
      }),
    ]);

    return {
      records: records.records,
      total,
      hasMore: offset + limit < total,
      offset,
    };
  }

  async read<T = Record<string, unknown>>(
    model: string,
    ids: number[],
    fields: string[]
  ): Promise<T[]> {
    return this.callKw<T[]>({
      model,
      method: "read",
      args: [ids],
      kwargs: { fields },
    });
  }

  async create(model: string, values: Record<string, unknown>): Promise<number> {
    return this.callKw<number>({
      model,
      method: "create",
      args: [values],
      kwargs: {},
    });
  }

  async write(
    model: string,
    ids: number[],
    values: Record<string, unknown>
  ): Promise<boolean> {
    return this.callKw<boolean>({
      model,
      method: "write",
      args: [ids, values],
      kwargs: {},
    });
  }

  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.callKw<boolean>({
      model,
      method: "unlink",
      args: [ids],
      kwargs: {},
    });
  }

  async nameSearch(
    model: string,
    name: string,
    domain: unknown[] = [],
    limit: number = 10
  ): Promise<Array<[number, string]>> {
    return this.callKw<Array<[number, string]>>({
      model,
      method: "name_search",
      args: [],
      kwargs: { name, args: domain, limit },
    });
  }

  // --- User Groups ---

  async fetchUserGroups(uid: number): Promise<string[]> {
    const groups = await this.callKw<Array<{ full_name: string }>>({
      model: "res.users",
      method: "read",
      args: [[uid]],
      kwargs: { fields: ["groups_id"] },
    });

    if (!groups.length) return [];

    const groupIds = (groups[0] as unknown as { groups_id: number[] }).groups_id;
    const groupRecords = await this.callKw<Array<{ full_name: string }>>({
      model: "res.groups",
      method: "read",
      args: [groupIds],
      kwargs: { fields: ["full_name"] },
    });

    return groupRecords.map((g) => g.full_name);
  }

  // --- Reports ---

  getReportUrl(
    reportName: string,
    recordIds: number[],
    format: "pdf" | "html" = "pdf"
  ): string {
    const ids = recordIds.join(",");
    return `${this.baseUrl}/report/${format}/${reportName}/${ids}`;
  }

  // --- Avatar URL ---

  getAvatarUrl(model: string, id: number, field: string = "avatar_128"): string {
    return `${this.baseUrl}/web/image/${model}/${id}/${field}`;
  }
}

// Singleton instance
export const odooRpc = new OdooRpcService();
export { OdooRpcError };
