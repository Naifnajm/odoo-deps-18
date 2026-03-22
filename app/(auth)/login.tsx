import { useState, useEffect, useCallback, useRef } from "react";
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
  Switch,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as LocalAuthentication from "expo-local-authentication";
import { useTheme } from "../../theme/theme";
import { useAuthStore } from "../../stores/auth-store";
import { useLanguageStore } from "../../stores/language-store";
import { odooRpc } from "../../services/odoo-rpc";
import { secureStorage } from "../../utils/storage";
import { MAIN_ROUTE } from "../../constants/navigation";
import { SPACING, RADIUS } from "../../theme/spacing";

export default function LoginScreen() {
  const { colors } = useTheme();
  const login = useAuthStore((s: any) => s.login);
  const isLoading = useAuthStore((s: any) => s.isLoading);
  const authError = useAuthStore((s: any) => s.error);
  const clearError = useAuthStore((s: any) => s.clearError);
  const language = useLanguageStore((s: any) => s.language);
  const setLanguage = useLanguageStore((s: any) => s.setLanguage);

  const [serverUrl, setServerUrl] = useState("");
  const [database, setDatabase] = useState("");
  const [databases, setDatabases] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingDbs, setIsLoadingDbs] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  // Shake animation for errors
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, []);

  // Load saved config on mount
  useEffect(() => {
    (async () => {
      const savedUrl = await secureStorage.getServerUrl();
      const savedDb = await secureStorage.getDatabase();
      const savedRemember = await secureStorage.isRememberMe();

      if (savedUrl) {
        setServerUrl(savedUrl);
        odooRpc.setBaseUrl(savedUrl);
        fetchDatabases(savedUrl);
      }
      if (savedDb) setDatabase(savedDb);
      setRememberMe(savedRemember);

      if (savedRemember) {
        const creds = await secureStorage.getCredentials();
        if (creds) {
          setUsername(creds.username);
          setPassword(creds.password);
        }
      }

      // Check biometric availability
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    })();
  }, []);

  const fetchDatabases = useCallback(async (url: string) => {
    setIsLoadingDbs(true);
    setDbError(null);
    try {
      const normalized = url.replace(/\/+$/, "");
      const dbs = await odooRpc.fetchDatabases(normalized);
      setDatabases(dbs);
      if (dbs.length === 1) {
        setDatabase(dbs[0]);
      }
    } catch {
      setDbError("Could not fetch databases");
      setDatabases([]);
    } finally {
      setIsLoadingDbs(false);
    }
  }, []);

  const handleServerUrlBlur = useCallback(() => {
    const normalized = serverUrl.trim().replace(/\/+$/, "");
    if (normalized && normalized !== odooRpc.getBaseUrl()) {
      let finalUrl = normalized;
      if (!finalUrl.startsWith("http")) {
        finalUrl = `https://${finalUrl}`;
      }
      setServerUrl(finalUrl);
      odooRpc.setBaseUrl(finalUrl);
      fetchDatabases(finalUrl);
    }
  }, [serverUrl, fetchDatabases]);

  const handleLogin = useCallback(async () => {
    clearError();

    if (!serverUrl.trim()) {
      triggerShake();
      return;
    }
    if (!database.trim()) {
      triggerShake();
      return;
    }
    if (!username.trim() || !password.trim()) {
      triggerShake();
      return;
    }

    // Save remember me preference
    await secureStorage.setRememberMe(rememberMe);

    try {
      await login({ db: database, login: username, password });

      router.replace(MAIN_ROUTE as never);
    } catch {
      triggerShake();
    }
  }, [serverUrl, database, username, password, rememberMe, login, clearError, triggerShake]);

  const handleBiometricLogin = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to OdooMobile",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (result.success) {
      const creds = await secureStorage.getCredentials();
      const db = await secureStorage.getDatabase();
      if (creds && db) {
        try {
          await login({ db, login: creds.username, password: creds.password });
          router.replace(MAIN_ROUTE as never);
        } catch {
          triggerShake();
        }
      }
    }
  }, [login, triggerShake]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ar" : "en");
  }, [language, setLanguage]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Language Toggle */}
        <TouchableOpacity
          style={[styles.langToggle, { backgroundColor: colors.elevated }]}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={[styles.langText, { color: colors.gold }]}>
            {language === "en" ? "AR" : "EN"}
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: colors.gold }]}>
            <Text style={styles.logoText}>O</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sign in to your Odoo account
          </Text>
        </View>

        <Animated.View style={[styles.form, shakeStyle]}>
          {/* Server URL */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              Server URL
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={serverUrl}
              onChangeText={setServerUrl}
              onBlur={handleServerUrlBlur}
              placeholder="https://your-company.odoo.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.setupLink}
              onPress={() => router.push("/(auth)/server-setup" as never)}
            >
              <Text style={[styles.setupLinkText, { color: colors.blue }]}>
                Configure server
              </Text>
            </TouchableOpacity>
          </View>

          {/* Database */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              Database
            </Text>
            {databases.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dbList}
              >
                {databases.map((db: string) => (
                  <TouchableOpacity
                    key={db}
                    style={[
                      styles.dbChip,
                      {
                        backgroundColor:
                          database === db ? colors.gold : colors.elevated,
                        borderColor:
                          database === db ? colors.gold : colors.border,
                      },
                    ]}
                    onPress={() => setDatabase(db)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dbChipText,
                        {
                          color: database === db ? "#080C14" : colors.text,
                          fontWeight: database === db ? "700" : "400",
                        },
                      ]}
                    >
                      {db}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={database}
                onChangeText={setDatabase}
                placeholder="Database name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            )}
            {isLoadingDbs && (
              <ActivityIndicator
                size="small"
                color={colors.gold}
                style={styles.dbLoader}
              />
            )}
            {dbError && (
              <Text style={[styles.errorMini, { color: colors.warning }]}>
                {dbError}
              </Text>
            )}
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              Username
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={username}
              onChangeText={(text: string) => {
                setUsername(text);
                clearError();
              }}
              placeholder="Email or username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              Password
            </Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={[
                  styles.input,
                  styles.passwordInput,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={password}
                onChangeText={(text: string) => {
                  setPassword(text);
                  clearError();
                }}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={[styles.eyeButton, { backgroundColor: colors.elevated }]}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Text style={[styles.eyeText, { color: colors.textMuted }]}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me */}
          <View style={styles.rememberRow}>
            <Switch
              value={rememberMe}
              onValueChange={(val: boolean) => {
                setRememberMe(val);
                secureStorage.setRememberMe(val);
              }}
              trackColor={{ false: colors.elevated, true: colors.gold }}
              thumbColor="#fff"
            />
            <Text style={[styles.rememberText, { color: colors.textMuted }]}>
              Remember me
            </Text>
          </View>

          {/* Error */}
          {authError && (
            <View style={[styles.errorBanner, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {authError}
              </Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: colors.gold, opacity: isLoading ? 0.7 : 1 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#080C14" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Biometric */}
          {biometricAvailable && (
            <TouchableOpacity
              style={[styles.biometricButton, { borderColor: colors.border }]}
              onPress={handleBiometricLogin}
              activeOpacity={0.7}
            >
              <Text style={[styles.biometricText, { color: colors.text }]}>
                Sign in with Biometrics
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
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
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING["2xl"],
  },
  langToggle: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  langText: {
    fontSize: 14,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING["2xl"],
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.base,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#080C14",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  form: {
    gap: SPACING.base,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.base,
    fontSize: 15,
  },
  setupLink: {
    alignSelf: "flex-end",
  },
  setupLinkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dbList: {
    flexDirection: "row",
    maxHeight: 40,
  },
  dbChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  dbChipText: {
    fontSize: 14,
  },
  dbLoader: {
    marginTop: SPACING.xs,
  },
  errorMini: {
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  passwordRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  rememberText: {
    fontSize: 14,
  },
  errorBanner: {
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#080C14",
  },
  biometricButton: {
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
