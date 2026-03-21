import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type QueryKey,
} from "@tanstack/react-query";
import { odooRpc, OdooRpcError } from "../services/odoo-rpc";
import { odooKeys } from "./use-odoo-query";

// --- Generic useOdooMutation ---

interface IOdooMutationOptions<TData, TVariables> {
  model: string;
  method: string;
  invalidateKeys?: QueryKey[];
  invalidateModel?: boolean;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: OdooRpcError, variables: TVariables) => void;
}

export function useOdooMutation<TData = unknown, TVariables = unknown>(
  options: IOdooMutationOptions<TData, TVariables>
): UseMutationResult<TData, OdooRpcError, TVariables> {
  const {
    model,
    method,
    invalidateKeys,
    invalidateModel = true,
    onSuccess,
    onError,
  } = options;

  const queryClient = useQueryClient();

  return useMutation<TData, OdooRpcError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const { args, kwargs } = variables as unknown as {
        args: unknown[];
        kwargs?: Record<string, unknown>;
      };
      return odooRpc.callKw<TData>({ model, method, args, kwargs });
    },
    onSuccess: (data: TData, variables: TVariables) => {
      // Invalidate related queries
      if (invalidateModel) {
        queryClient.invalidateQueries({ queryKey: odooKeys.model(model) });
      }
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      onSuccess?.(data, variables);
    },
    onError: (error: OdooRpcError, variables: TVariables) => {
      onError?.(error, variables);
    },
  });
}

// --- useOdooCreate ---

interface ICreateVariables {
  values: Record<string, unknown>;
}

export function useOdooCreate(
  model: string,
  options?: {
    invalidateKeys?: QueryKey[];
    onSuccess?: (id: number) => void;
    onError?: (error: OdooRpcError) => void;
  }
): UseMutationResult<number, OdooRpcError, ICreateVariables> {
  const queryClient = useQueryClient();

  return useMutation<number, OdooRpcError, ICreateVariables>({
    mutationFn: async ({ values }: ICreateVariables) => {
      return odooRpc.create(model, values);
    },
    onSuccess: (id: number) => {
      queryClient.invalidateQueries({ queryKey: odooKeys.model(model) });
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.(id);
    },
    onError: options?.onError,
  });
}

// --- useOdooWrite (with optimistic update support) ---

interface IWriteVariables {
  ids: number[];
  values: Record<string, unknown>;
}

interface IOptimisticConfig<T> {
  queryKey: QueryKey;
  updater: (old: T, variables: IWriteVariables) => T;
}

export function useOdooWrite<T = unknown>(
  model: string,
  options?: {
    invalidateKeys?: QueryKey[];
    optimistic?: IOptimisticConfig<T>;
    onSuccess?: () => void;
    onError?: (error: OdooRpcError) => void;
  }
): UseMutationResult<boolean, OdooRpcError, IWriteVariables> {
  const queryClient = useQueryClient();

  return useMutation<boolean, OdooRpcError, IWriteVariables>({
    mutationFn: async ({ ids, values }: IWriteVariables) => {
      return odooRpc.write(model, ids, values);
    },
    onMutate: async (variables: IWriteVariables) => {
      if (!options?.optimistic) return;

      const { queryKey, updater } = options.optimistic;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previous = queryClient.getQueryData<T>(queryKey);

      // Optimistically update
      if (previous !== undefined) {
        queryClient.setQueryData<T>(queryKey, (old: T | undefined) =>
          old !== undefined ? updater(old, variables) : old
        );
      }

      return { previous };
    },
    onError: (error: OdooRpcError, _variables: IWriteVariables, context: unknown) => {
      // Rollback optimistic update
      if (options?.optimistic && context) {
        const { queryKey } = options.optimistic;
        const ctx = context as { previous: T };
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      options?.onError?.(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: odooKeys.model(model) });
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.();
    },
  });
}

// --- useOdooDelete ---

interface IDeleteVariables {
  ids: number[];
}

export function useOdooDelete(
  model: string,
  options?: {
    invalidateKeys?: QueryKey[];
    onSuccess?: () => void;
    onError?: (error: OdooRpcError) => void;
  }
): UseMutationResult<boolean, OdooRpcError, IDeleteVariables> {
  const queryClient = useQueryClient();

  return useMutation<boolean, OdooRpcError, IDeleteVariables>({
    mutationFn: async ({ ids }: IDeleteVariables) => {
      return odooRpc.unlink(model, ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: odooKeys.model(model) });
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
