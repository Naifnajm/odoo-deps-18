import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

interface IFABAction {
  label: string;
  icon: string;
  onPress: () => void;
}

interface IFABGroupProps {
  actions: IFABAction[];
  mainIcon?: string;
}

export function FABGroup({ actions, mainIcon = "+" }: IFABGroupProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    animation.value = next
      ? withSpring(1, { damping: 15, stiffness: 200 })
      : withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
  }, [isOpen]);

  const handleAction = useCallback(
    (action: IFABAction) => {
      setIsOpen(false);
      animation.value = withTiming(0, { duration: 150 });
      action.onPress();
    },
    []
  );

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(animation.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: animation.value * 0.4,
    pointerEvents: animation.value > 0.1 ? "auto" as const : "none" as const,
  }));

  return (
    <>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />
      </Animated.View>

      <View style={styles.container}>
        {/* Action buttons */}
        {actions.map((action, index) => {
          const actionStyle = useAnimatedStyle(() => ({
            opacity: animation.value,
            transform: [
              {
                translateY: interpolate(
                  animation.value,
                  [0, 1],
                  [20, 0]
                ),
              },
              {
                scale: interpolate(animation.value, [0, 1], [0.6, 1]),
              },
            ],
          }));

          return (
            <Animated.View
              key={action.label}
              style={[styles.actionRow, actionStyle]}
            >
              <View
                style={[styles.actionLabel, { backgroundColor: colors.elevated }]}
              >
                <Text style={[styles.actionLabelText, { color: colors.text }]}>
                  {action.label}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.blue }]}
                onPress={() => handleAction(action)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Main FAB */}
        <TouchableOpacity
          style={[styles.mainFab, { backgroundColor: colors.gold }]}
          onPress={toggle}
          activeOpacity={0.8}
        >
          <Animated.Text style={[styles.mainIcon, rotateStyle]}>
            {mainIcon}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 998,
  },
  container: {
    position: "absolute",
    bottom: 90,
    right: SPACING.xl,
    alignItems: "flex-end",
    zIndex: 999,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  actionLabel: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  actionLabelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 18,
    color: "#fff",
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  mainIcon: {
    fontSize: 28,
    fontWeight: "300",
    color: "#080C14",
  },
});
