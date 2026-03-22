import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../stores/auth-store";
import { MAIN_ROUTE } from "../constants/navigation";

export function useRoleRedirect(): void {
  const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(MAIN_ROUTE as never);
    }
  }, [isAuthenticated]);
}

export function useAuthGuard(): void {
  const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated);
  const sessionChecked = useAuthStore((s: any) => s.sessionChecked);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      router.replace("/(auth)/login" as never);
    }
  }, [isAuthenticated, sessionChecked]);
}
