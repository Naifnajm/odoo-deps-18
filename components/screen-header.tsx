import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

interface IScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  avatarUrl?: string;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  avatarUrl,
  rightAction,
  style,
}: IScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + SPACING.sm,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.backArrow, { color: colors.text }]}>{"\u2190"}</Text>
          </TouchableOpacity>
        )}
        {avatarUrl && (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={styles.titleGroup}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: SPACING.md,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 22,
    fontWeight: "600",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
});
