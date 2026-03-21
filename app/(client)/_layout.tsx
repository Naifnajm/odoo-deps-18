import { Tabs } from "expo-router";
import { useTheme } from "../../theme/theme";
import { useAuthGuard } from "../../hooks/use-role-redirect";
import { TabIcon } from "../../components/tab-icon";
import { SPACING } from "../../theme/spacing";

export default function ClientLayout() {
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
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="projects" color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: "Invoices",
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="invoices" color={color} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="support" color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="documents" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }: { color: string }) => <TabIcon name="profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
