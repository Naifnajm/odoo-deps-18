import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

type TBadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "gold";

interface IStatusBadgeProps {
  label: string;
  variant?: TBadgeVariant;
  size?: "sm" | "md";
  style?: ViewStyle;
}

const VARIANT_CONFIG: Record<TBadgeVariant, { bgKey: string; textKey: string }> = {
  success: { bgKey: "success", textKey: "success" },
  warning: { bgKey: "warning", textKey: "warning" },
  danger: { bgKey: "danger", textKey: "danger" },
  info: { bgKey: "blue", textKey: "blue" },
  neutral: { bgKey: "textMuted", textKey: "textMuted" },
  gold: { bgKey: "gold", textKey: "gold" },
};

export function StatusBadge({
  label,
  variant = "neutral",
  size = "sm",
  style,
}: IStatusBadgeProps) {
  const { colors } = useTheme();
  const config = VARIANT_CONFIG[variant];
  const bgColor = (colors as Record<string, string>)[config.bgKey] ?? colors.textMuted;
  const textColor = (colors as Record<string, string>)[config.textKey] ?? colors.textMuted;

  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${bgColor}18`,
          paddingHorizontal: isSmall ? SPACING.sm : SPACING.md,
          paddingVertical: isSmall ? 2 : SPACING.xs,
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: bgColor }]} />
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: "600",
  },
});
