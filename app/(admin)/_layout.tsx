import { Tabs } from "expo-router";
import { useTheme } from "../../theme/theme";
import { useAuthGuard } from "../../hooks/use-role-redirect";
import { SPACING } from "../../theme/spacing";

export default function AdminLayout() {
  const { colors } = useTheme();
  useAuthGuard();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.xs,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        lazy: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Dashboard" }}
      />
      <Tabs.Screen
        name="crm"
        options={{ title: "CRM" }}
      />
      <Tabs.Screen
        name="projects"
        options={{ title: "Projects" }}
      />
      <Tabs.Screen
        name="invoices"
        options={{ title: "Invoices" }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: "Reports" }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings" }}
      />
    </Tabs>
  );
}
