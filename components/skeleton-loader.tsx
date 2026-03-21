import React, { useEffect } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "../theme/theme";
import { RADIUS } from "../theme/spacing";

export interface ISkeletonLoaderProps {
  key?: React.Key;
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = RADIUS.sm,
  style,
}: ISkeletonLoaderProps) {
  const { colors } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface ISkeletonGroupProps {
  count?: number;
  itemHeight?: number;
  gap?: number;
  style?: ViewStyle;
}

export function SkeletonGroup({
  count = 5,
  itemHeight = 72,
  gap = 12,
  style,
}: ISkeletonGroupProps) {
  return (
    <Animated.View style={[styles.group, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width="100%"
          height={itemHeight}
          borderRadius={RADIUS.md}
          style={i < count - 1 ? { marginBottom: gap } : undefined}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  group: {
    width: "100%",
  },
});
