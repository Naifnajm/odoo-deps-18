import { QueryClient } from "@tanstack/react-query";
import { OdooRpcError } from "./odoo-rpc";

const MAX_RETRIES = 2;

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= MAX_RETRIES) return false;

  // Don't retry auth or access errors
  if (error instanceof OdooRpcError) {
    const code = error.code;
    if (code === 100 || code === 200) return false; // session expired or access denied
  }

  return true;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 5 * 60 * 1000, // 5 minutes for lists
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

// Stale time presets for different data types
export const STALE_TIMES = {
  DASHBOARD: 30 * 1000, // 30 seconds for KPIs
  LIST: 5 * 60 * 1000, // 5 minutes for list views
  DETAIL: 2 * 60 * 1000, // 2 minutes for detail views
  STATIC: 30 * 60 * 1000, // 30 minutes for rarely changing data
  REALTIME: 10 * 1000, // 10 seconds for real-time data
} as const;
