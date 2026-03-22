import { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import { useNotifications, type IOdooNotification } from "../../hooks/use-notifications";
import { odooRpc } from "../../services/odoo-rpc";
import { SkeletonGroup } from "../../components/skeleton-loader";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["odoo", "mail.message"] });
  }, [queryClient]);

  const handleOpenNotification = useCallback(
    (notif: IOdooNotification) => {
      if (notif.model && notif.resId) {
        const baseUrl = odooRpc.getBaseUrl();
        const url = `${baseUrl}/web#model=${notif.model}&id=${notif.resId}&view_type=form`;
        router.push({
          pathname: "/(main)/webview",
          params: { url, title: notif.subject || "Record" },
        } as never);
      }
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: IOdooNotification }) => (
      <TouchableOpacity
        style={[
          styles.notifCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => handleOpenNotification(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notifHeader}>
          <View
            style={[styles.notifAvatar, { backgroundColor: colors.gold }]}
          >
            <Text style={styles.notifAvatarText}>
              {(item.authorName ?? "O")[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.notifMeta}>
            <Text
              style={[styles.notifAuthor, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.authorName || "System"}
            </Text>
            <Text style={[styles.notifDate, { color: colors.textMuted }]}>
              {formatDate(item.date)}
            </Text>
          </View>
        </View>
        {item.subject ? (
          <Text
            style={[styles.notifSubject, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.subject}
          </Text>
        ) : null}
        {item.preview ? (
          <Text
            style={[styles.notifPreview, { color: colors.textMuted }]}
            numberOfLines={3}
          >
            {item.preview}
          </Text>
        ) : null}
        {item.model ? (
          <View style={styles.notifFooter}>
            <Text style={[styles.notifModel, { color: colors.blue }]}>
              {item.modelName || item.model}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    ),
    [colors, handleOpenNotification]
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + SPACING.sm, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Inbox</Text>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
          {notifications.data?.length ?? 0} messages
        </Text>
      </View>

      {notifications.isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonGroup count={5} itemHeight={100} />
        </View>
      ) : (
        <FlashList
          data={notifications.data ?? []}
          renderItem={renderItem}
          estimatedItemSize={120}
          contentContainerStyle={{
            paddingHorizontal: SPACING.xl,
            paddingTop: SPACING.md,
            paddingBottom: insets.bottom + 80,
          }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={notifications.isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No notifications
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 2 },

  loadingContainer: { padding: SPACING.xl },

  notifCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  notifAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  notifAvatarText: { fontSize: 16, fontWeight: "700", color: "#080C14" },
  notifMeta: { flex: 1 },
  notifAuthor: { fontSize: 14, fontWeight: "600" },
  notifDate: { fontSize: 12, marginTop: 1 },
  notifSubject: { fontSize: 15, fontWeight: "600" },
  notifPreview: { fontSize: 13, lineHeight: 18 },
  notifFooter: { flexDirection: "row", marginTop: SPACING.xs },
  notifModel: { fontSize: 12, fontWeight: "600" },

  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 16 },
});
