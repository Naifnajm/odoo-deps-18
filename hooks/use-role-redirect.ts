import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../stores/auth-store";
import { ROLE_INITIAL_ROUTE } from "../constants/navigation";

export function useRoleRedirect(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (isAuthenticated && role) {
      const route = ROLE_INITIAL_ROUTE[role];
      router.replace(route as never);
    }
  }, [isAuthenticated, role]);
}

export function useAuthGuard(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionChecked = useAuthStore((s) => s.sessionChecked);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      router.replace("/(auth)/login" as never);
    }
  }, [isAuthenticated, sessionChecked]);
}
