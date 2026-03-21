import { Tabs } from "expo-router";
import { useTheme } from "../../theme/theme";
import { useAuthGuard } from "../../hooks/use-role-redirect";
import { TabIcon } from "../../components/tab-icon";
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
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabIcon name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="crm"
        options={{
          title: "CRM",
          tabBarIcon: ({ color }) => <TabIcon name="crm" color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color }) => <TabIcon name="projects" color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color }) => <TabIcon name="invoices" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <TabIcon name="reports" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
