import {
  useQuery,
  useInfiniteQuery,
  type UseQueryResult,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { odooRpc, OdooRpcError } from "../services/odoo-rpc";
import { cacheStorage } from "../utils/storage";
import { STALE_TIMES } from "../services/query-client";
import { odooKeys } from "./use-odoo-query";
import type {
  IOdooSearchReadResult,
  IOdooPaginatedResult,
} from "../types/odoo";

// --- useOdooSearchRead ---

interface ISearchReadOptions<T> {
  model: string;
  domain: unknown[];
  fields: string[];
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, unknown>;
  enabled?: boolean;
  staleTime?: number;
  offlineCache?: boolean;
}

export function useOdooSearchRead<T = Record<string, unknown>>(
  options: ISearchReadOptions<T>
): UseQueryResult<IOdooSearchReadResult<T>, OdooRpcError> {
  const {
    model,
    domain,
    fields,
    limit = 80,
    offset = 0,
    order = "id desc",
    context,
    enabled = true,
    staleTime = STALE_TIMES.LIST,
    offlineCache = true,
  } = options;

  const queryParams = { domain, fields, limit, offset, order };
  const key = odooKeys.search(model, domain, queryParams);
  const cacheKey = cacheStorage.getCacheKey(model, "search_read", [queryParams]);

  return useQuery<IOdooSearchReadResult<T>, OdooRpcError>({
    queryKey: key,
    queryFn: async () => {
      const result = await odooRpc.searchRead<T>({
        model,
        domain,
        fields,
        limit,
        offset,
        order,
        context,
      });

      if (offlineCache) {
        cacheStorage.set(cacheKey, result);
      }

      return result;
    },
    staleTime,
    enabled,
    placeholderData: offlineCache
      ? () => cacheStorage.get<IOdooSearchReadResult<T>>(cacheKey) ?? undefined
      : undefined,
  });
}

// --- useOdooInfiniteList (infinite scroll) ---

interface IInfiniteListOptions<T> {
  model: string;
  domain: unknown[];
  fields: string[];
  pageSize?: number;
  order?: string;
  context?: Record<string, unknown>;
  enabled?: boolean;
  staleTime?: number;
}

export function useOdooInfiniteList<T = Record<string, unknown>>(
  options: IInfiniteListOptions<T>
): UseInfiniteQueryResult<{ pages: IOdooPaginatedResult<T>[] }, OdooRpcError> {
  const {
    model,
    domain,
    fields,
    pageSize = 40,
    order = "id desc",
    context,
    enabled = true,
    staleTime = STALE_TIMES.LIST,
  } = options;

  const key = odooKeys.search(model, domain, { fields, pageSize, order });

  return useInfiniteQuery<
    IOdooPaginatedResult<T>,
    OdooRpcError,
    { pages: IOdooPaginatedResult<T>[] },
    typeof key,
    number
  >({
    queryKey: key,
    queryFn: async ({ pageParam }) => {
      return odooRpc.searchReadPaginated<T>({
        model,
        domain,
        fields,
        limit: pageSize,
        offset: pageParam,
        order,
        context,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.offset + pageSize;
    },
    staleTime,
    enabled,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
    }),
  });
}

// --- useOdooDetail (single record) ---

interface IDetailOptions<T> {
  model: string;
  id: number;
  fields: string[];
  enabled?: boolean;
  staleTime?: number;
}

export function useOdooDetail<T = Record<string, unknown>>(
  options: IDetailOptions<T>
): UseQueryResult<T, OdooRpcError> {
  const {
    model,
    id,
    fields,
    enabled = true,
    staleTime = STALE_TIMES.DETAIL,
  } = options;

  const key = odooKeys.detail(model, id);
  const cacheKey = cacheStorage.getCacheKey(model, "read", [id]);

  return useQuery<T, OdooRpcError>({
    queryKey: key,
    queryFn: async () => {
      const records = await odooRpc.read<T>(model, [id], fields);
      if (!records.length) {
        throw new OdooRpcError({
          code: 404,
          message: "Record not found",
          data: {
            name: "RecordNotFound",
            debug: `${model}(${id})`,
            message: "Record not found",
            arguments: [],
          },
        });
      }
      const record = records[0];
      cacheStorage.set(cacheKey, record);
      return record;
    },
    staleTime,
    enabled: enabled && id > 0,
    placeholderData: () => cacheStorage.get<T>(cacheKey) ?? undefined,
  });
}
