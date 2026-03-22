import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { useTheme } from "../../theme/theme";
import { SPACING } from "../../theme/spacing";
import { odooRpc } from "../../services/odoo-rpc";

export default function WebViewScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ url: string; title?: string }>();
  const webViewRef = useRef<WebView>(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTitle, setCurrentTitle] = useState(params.title || "Odoo");

  const targetUrl = params.url || `${odooRpc.getBaseUrl()}/web`;

  // Inject session cookie for authentication
  const sessionId = odooRpc.getSessionId();
  const injectedJS = `
    (function() {
      document.cookie = "session_id=${sessionId}; path=/; SameSite=Lax";
      // Make Odoo responsive on mobile
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
        document.head.appendChild(meta);
      }
    })();
    true;
  `;

  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    } else {
      router.back();
    }
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  }, [canGoForward]);

  const handleReload = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  // Web platform fallback - use iframe
  if (Platform.OS === "web") {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + SPACING.xs,
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerButtonText, { color: colors.text }]}>
              {"\u2190"}
            </Text>
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {currentTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.iframeContainer}>
          <iframe
            src={targetUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title={currentTitle}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + SPACING.xs,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>
            {"\u2715"}
          </Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {currentTitle}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleReload}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerButtonText, { color: colors.text }]}>
            {"\u21BB"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Bar */}
      {isLoading && (
        <View style={[styles.loadingBar, { backgroundColor: colors.gold }]} />
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: targetUrl }}
        style={styles.webview}
        injectedJavaScript={injectedJS}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
          if (navState.title && navState.title !== "about:blank") {
            setCurrentTitle(navState.title);
          }
        }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        renderLoading={() => (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        )}
      />

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + SPACING.xs,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.navButton, { opacity: canGoBack ? 1 : 0.3 }]}
          onPress={handleGoBack}
          disabled={!canGoBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>
            {"\u2190"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, { opacity: canGoForward ? 1 : 0.3 }]}
          onPress={handleGoForward}
          disabled={!canGoForward}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>
            {"\u2192"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const baseUrl = odooRpc.getBaseUrl();
            webViewRef.current?.injectJavaScript(
              `window.location.href = '${baseUrl}/web'; true;`
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { color: colors.gold }]}>
            {"\u2302"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleReload}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>
            {"\u21BB"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButtonText: { fontSize: 20, fontWeight: "600" },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: { width: 36 },

  loadingBar: {
    height: 2,
    width: "100%",
  },

  webview: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  iframeContainer: {
    flex: 1,
  },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  navButton: {
    width: 48,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonText: { fontSize: 22 },
});
