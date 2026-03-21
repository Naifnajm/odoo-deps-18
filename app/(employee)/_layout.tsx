import { Tabs } from "expo-router";
import { useTheme } from "../../theme/theme";
import { useAuthGuard } from "../../hooks/use-role-redirect";
import { TabIcon } from "../../components/tab-icon";
import { SPACING } from "../../theme/spacing";

export default function EmployeeLayout() {
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
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <TabIcon name="tasks" color={color} />,
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
        name="hr"
        options={{
          title: "HR",
          tabBarIcon: ({ color }) => <TabIcon name="hr" color={color} />,
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
