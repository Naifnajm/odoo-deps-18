import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryKey,
} from "@tanstack/react-query";
import { odooRpc, OdooRpcError } from "../services/odoo-rpc";
import { cacheStorage } from "../utils/storage";
import { STALE_TIMES } from "../services/query-client";

// --- Query Key Factory ---

export const odooKeys = {
  all: ["odoo"] as const,
  model: (model: string) => ["odoo", model] as const,
  method: (model: string, method: string) =>
    ["odoo", model, method] as const,
  detail: (model: string, id: number) =>
    ["odoo", model, "detail", id] as const,
  list: (model: string, params?: Record<string, unknown>) =>
    ["odoo", model, "list", ...(params ? [params] : [])] as const,
  search: (model: string, domain: unknown[], params?: Record<string, unknown>) =>
    ["odoo", model, "search", domain, ...(params ? [params] : [])] as const,
  custom: (model: string, method: string, args: unknown[]) =>
    ["odoo", model, method, ...args] as const,
};

// --- Core useOdooQuery Hook ---

interface IOdooQueryOptions<TData> {
  model: string;
  method: string;
  args: unknown[];
  kwargs?: Record<string, unknown>;
  queryKey?: QueryKey;
  staleTime?: number;
  enabled?: boolean;
  offlineCache?: boolean;
  select?: (data: unknown) => TData;
  placeholderData?: TData | (() => TData);
}

export function useOdooQuery<TData = unknown>(
  options: IOdooQueryOptions<TData>
): UseQueryResult<TData, OdooRpcError> {
  const {
    model,
    method,
    args,
    kwargs,
    queryKey,
    staleTime = STALE_TIMES.LIST,
    enabled = true,
    offlineCache = true,
    select,
    placeholderData,
  } = options;

  const key = queryKey ?? odooKeys.custom(model, method, args);
  const cacheKey = cacheStorage.getCacheKey(model, method, args);

  return useQuery<unknown, OdooRpcError, TData>({
    queryKey: key,
    queryFn: async () => {
      const result = await odooRpc.callKw({
        model,
        method,
        args,
        kwargs,
      });

      // Persist to MMKV for offline access
      if (offlineCache) {
        cacheStorage.set(cacheKey, result);
      }

      return result;
    },
    staleTime,
    enabled,
    select: select as ((data: unknown) => TData) | undefined,
    placeholderData: offlineCache
      ? () => {
          const cached = cacheStorage.get<TData>(cacheKey);
          if (cached !== null) return cached as unknown;
          return typeof placeholderData === "function"
            ? (placeholderData as () => TData)()
            : (placeholderData as unknown);
        }
      : (placeholderData as unknown as TData | undefined),
  });
}
