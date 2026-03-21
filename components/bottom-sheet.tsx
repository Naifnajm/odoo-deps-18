import { useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface IBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: number[];
  children: React.ReactNode;
}

export function BottomSheet({
  isVisible,
  onClose,
  title,
  snapPoints = [SCREEN_HEIGHT * 0.5],
  children,
}: IBottomSheetProps) {
  const { colors } = useTheme();
  const sheetHeight = snapPoints[0];
  const translateY = useSharedValue(sheetHeight);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 25, stiffness: 200 });
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(sheetHeight, { duration: 250 });
      overlayOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, sheetHeight]);

  const handleClose = useCallback(() => {
    translateY.value = withTiming(sheetHeight, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    });
    overlayOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 260);
  }, [onClose, sheetHeight]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event: any) => {
      const newY = context.value.y + event.translationY;
      translateY.value = Math.max(0, newY);
    })
    .onEnd((event: any) => {
      if (event.translationY > sheetHeight * 0.3 || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 25, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? "auto" as const : "none" as const,
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: colors.elevated,
            },
            sheetStyle,
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          </View>

          {/* Title */}
          {title && (
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                <Text style={[styles.closeText, { color: colors.textMuted }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeText: {
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
});
