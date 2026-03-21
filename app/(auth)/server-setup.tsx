import { View, StyleSheet } from "react-native";
import { useTheme } from "../../theme/theme";

export default function ServerSetupScreen() {
  const { colors } = useTheme();
  return <View style={[styles.container, { backgroundColor: colors.background }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
