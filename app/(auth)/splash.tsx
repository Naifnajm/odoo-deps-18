import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../theme/theme";
import { useAuthStore } from "../../stores/auth-store";
import { MAIN_ROUTE } from "../../constants/navigation";

const SPLASH_DURATION = 2500;

export default function SplashScreen() {
  const { colors } = useTheme();
  const restoreSession = useAuthStore((s: any) => s.restoreSession);

  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  useEffect(() => {
    // Start logo animation
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 300, easing: Easing.inOut(Easing.cubic) })
    );
    subtitleOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 500 })
    );

    // Attempt session restore
    const timer = setTimeout(async () => {
      try {
        const restored = await restoreSession();
        if (restored) {
          router.replace(MAIN_ROUTE as never);
          return;
        }
      } catch {
        // Session restore failed, go to login
      }
      router.replace("/(auth)/login" as never);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={[styles.logoIcon, { backgroundColor: colors.gold }]}>
          <Text style={styles.logoLetter}>O</Text>
        </View>
      </Animated.View>

      <Animated.View style={subtitleAnimatedStyle}>
        <Text style={[styles.appName, { color: colors.text }]}>OdooMobile</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Enterprise on the go
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={[styles.loadingBar, { backgroundColor: colors.elevated }]}>
          <LoadingIndicator color={colors.gold} />
        </View>
      </View>
    </View>
  );
}

function LoadingIndicator({ color }: { color: string }) {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withSequence(
      withTiming(200, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
      withTiming(-100, { duration: 0 }),
      withTiming(200, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
      withTiming(-100, { duration: 0 }),
      withTiming(200, { duration: 1000, easing: Easing.inOut(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 60,
          height: 3,
          borderRadius: 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: "700",
    color: "#080C14",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  loadingBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
});
