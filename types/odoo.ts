export interface IOdooServerConfig {
  url: string;
  database: string;
}

export interface IOdooAuthParams {
  db: string;
  login: string;
  password: string;
}

export interface IOdooSessionInfo {
  uid: number;
  session_id: string;
  username: string;
  name: string;
  partner_id: number;
  company_id: number;
  user_context: Record<string, unknown>;
  is_admin: boolean;
  server_version: string;
}

export interface IOdooAuthResponse {
  jsonrpc: "2.0";
  id: number | null;
  result?: IOdooSessionInfo;
  error?: IOdooRpcError;
}

export interface IOdooRpcParams {
  model: string;
  method: string;
  args: unknown[];
  kwargs?: Record<string, unknown>;
}

export interface IOdooRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number | null;
  result?: T;
  error?: IOdooRpcError;
}

export interface IOdooRpcError {
  code: number;
  message: string;
  data: {
    name: string;
    debug: string;
    message: string;
    arguments: string[];
    exception_type?: string;
  };
}

export interface IOdooSearchReadParams {
  model: string;
  domain: unknown[];
  fields: string[];
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, unknown>;
}

export interface IOdooSearchReadResult<T = Record<string, unknown>> {
  length: number;
  records: T[];
}

export interface IOdooPaginatedResult<T = Record<string, unknown>> {
  records: T[];
  total: number;
  hasMore: boolean;
  offset: number;
}

export interface IOdooDatabaseListResponse {
  jsonrpc: "2.0";
  id: number | null;
  result?: string[];
  error?: IOdooRpcError;
}

export type TUserRole = "admin" | "employee" | "client";

export interface IUserProfile {
  uid: number;
  name: string;
  login: string;
  email: string;
  phone: string;
  partnerId: number;
  companyId: number;
  companyName: string;
  avatarUrl: string;
  role: TUserRole;
  lang: string;
  tz: string;
  groups: string[];
  serverVersion: string;
}
