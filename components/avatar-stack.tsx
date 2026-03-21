import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../theme/theme";
import { RADIUS } from "../theme/spacing";

interface IAvatarItem {
  id: number;
  name: string;
  imageUrl?: string;
}

interface IAvatarStackProps {
  avatars: IAvatarItem[];
  maxDisplay?: number;
  size?: number;
  style?: ViewStyle;
}

export function AvatarStack({
  avatars,
  maxDisplay = 4,
  size = 32,
  style,
}: IAvatarStackProps) {
  const { colors } = useTheme();
  const displayed = avatars.slice(0, maxDisplay);
  const overflow = avatars.length - maxDisplay;
  const overlap = size * 0.3;

  return (
    <View style={[styles.container, style]}>
      {displayed.map((avatar, index) => (
        <View
          key={avatar.id}
          style={[
            styles.avatarWrapper,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.card,
              marginLeft: index > 0 ? -overlap : 0,
              zIndex: displayed.length - index,
            },
          ]}
        >
          {avatar.imageUrl ? (
            <Image
              source={{ uri: avatar.imageUrl }}
              style={{
                width: size - 4,
                height: size - 4,
                borderRadius: (size - 4) / 2,
              }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                {
                  width: size - 4,
                  height: size - 4,
                  borderRadius: (size - 4) / 2,
                  backgroundColor: colors.elevated,
                },
              ]}
            >
              <Text
                style={[
                  styles.initial,
                  { color: colors.textMuted, fontSize: size * 0.35 },
                ]}
              >
                {avatar.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflowBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.elevated,
              borderColor: colors.card,
              marginLeft: -overlap,
            },
          ]}
        >
          <Text
            style={[
              styles.overflowText,
              { color: colors.textMuted, fontSize: size * 0.3 },
            ]}
          >
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    fontWeight: "700",
  },
  overflowBadge: {
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  overflowText: {
    fontWeight: "700",
  },
});
