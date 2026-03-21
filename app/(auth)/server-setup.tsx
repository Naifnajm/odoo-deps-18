import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../theme/theme";
import { odooRpc } from "../../services/odoo-rpc";
import { secureStorage } from "../../utils/storage";
import { SPACING, RADIUS } from "../../theme/spacing";

export default function ServerSetupScreen() {
  const { colors } = useTheme();

  const [url, setUrl] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizeUrl = (input: string): string => {
    let normalized = input.trim().replace(/\/+$/, "");
    if (normalized && !normalized.startsWith("http")) {
      normalized = `https://${normalized}`;
    }
    return normalized;
  };

  const handleValidate = useCallback(async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Please enter a server URL");
      return;
    }

    setIsValidating(true);
    setError(null);
    setServerVersion(null);

    try {
      const version = await odooRpc.fetchServerVersion(normalized);
      if (version) {
        setServerVersion(version);
        odooRpc.setBaseUrl(normalized);
        await secureStorage.setServerUrl(normalized);
      } else {
        setError("Could not connect. Check the URL and try again.");
      }
    } catch {
      setError("Connection failed. Verify the server is reachable.");
    } finally {
      setIsValidating(false);
    }
  }, [url]);

  const handleContinue = useCallback(() => {
    router.replace("/(auth)/login" as never);
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: colors.gold }]}>
            <Text style={styles.iconText}>O</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Connect to Odoo
          </Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            Enter your Odoo server URL to get started
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Server URL
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: error ? colors.danger : colors.border,
              },
            ]}
            value={url}
            onChangeText={(text: string) => {
              setUrl(text);
              setError(null);
              setServerVersion(null);
            }}
            placeholder="https://your-company.odoo.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleValidate}
          />

          {error && (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          )}

          {serverVersion && (
            <View style={[styles.successBanner, { backgroundColor: colors.elevated }]}>
              <Text style={[styles.successText, { color: colors.success }]}>
                Connected to Odoo {serverVersion}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: serverVersion ? colors.gold : colors.blue,
                opacity: isValidating ? 0.7 : 1,
              },
            ]}
            onPress={serverVersion ? handleContinue : handleValidate}
            disabled={isValidating}
            activeOpacity={0.7}
          >
            {isValidating ? (
              <ActivityIndicator color="#080C14" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {serverVersion ? "Continue to Login" : "Validate Connection"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING["2xl"],
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  iconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#080C14",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  form: {
    gap: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    fontSize: 16,
  },
  errorText: {
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  successBanner: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: "center",
  },
  successText: {
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#080C14",
  },
});
