import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../theme/theme";
import { SPACING } from "../theme/spacing";

type TNetworkStatus = "online" | "offline" | "reconnecting";

interface INetworkBannerProps {
  status: TNetworkStatus;
}

export function NetworkBanner({ status }: INetworkBannerProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(-50);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (status === "online") {
      // Show briefly then hide
      translateY.value = withTiming(0, { duration: 200 });
      setTimeout(() => {
        translateY.value = withTiming(-50, { duration: 300 });
      }, 2000);
    } else if (status === "offline" || status === "reconnecting") {
      translateY.value = withTiming(0, { duration: 200 });
    }

    if (status === "reconnecting") {
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [status]);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const bgColor =
    status === "online"
      ? colors.success
      : status === "reconnecting"
        ? colors.warning
        : colors.danger;

  const label =
    status === "online"
      ? "Back online"
      : status === "reconnecting"
        ? "Reconnecting..."
        : "No internet connection";

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bgColor }, bannerStyle]}>
      <Animated.Text style={[styles.text, textStyle]}>{label}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: SPACING.sm,
    alignItems: "center",
    zIndex: 9999,
  },
  text: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
