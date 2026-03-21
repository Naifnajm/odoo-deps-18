import { useEffect, useCallback, useState } from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

interface IKPICardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  style?: ViewStyle;
}

export function KPICard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendValue,
  style,
}: IKPICardProps) {
  const { colors } = useTheme();
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const trendColor =
    trend === "up"
      ? colors.success
      : trend === "down"
        ? colors.danger
        : colors.textMuted;

  const trendArrow =
    trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <AnimatedCountUp
        value={animatedValue}
        prefix={prefix}
        suffix={suffix}
        textColor={colors.text}
      />
      {trend && trendValue && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trendArrow} {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}

interface IAnimatedCountUpProps {
  value: Animated.SharedValue<number>;
  prefix: string;
  suffix: string;
  textColor: string;
}

function AnimatedCountUp({ value, prefix, suffix, textColor }: IAnimatedCountUpProps) {
  const [displayText] = useAnimatedText(value, prefix, suffix);

  return (
    <Text style={[styles.value, { color: textColor }]}>{displayText}</Text>
  );
}

function useAnimatedText(
  value: Animated.SharedValue<number>,
  prefix: string,
  suffix: string
): [string, (text: string) => void] {
  const [text, setText] = useState(`${prefix}0${suffix}`);

  const updateText = useCallback((t: string) => setText(t), []);

  useDerivedValue(() => {
    const rounded = Math.round(value.value);
    const formatted = formatNumber(rounded);
    runOnJS(updateText)(`${prefix}${formatted}${suffix}`);
  });

  return [text, setText];
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minWidth: 140,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
