import { useCallback } from "react";
import {
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useTheme } from "../theme/theme";
import { SkeletonGroup } from "./skeleton-loader";
import { SPACING } from "../theme/spacing";

interface IOdooListProps<T> {
  data: T[] | undefined;
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  estimatedItemSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement;
  contentContainerStyle?: ViewStyle;
  numColumns?: number;
}

export function OdooList<T>({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  hasMore = false,
  isLoadingMore = false,
  estimatedItemSize = 72,
  emptyTitle = "No items",
  emptyMessage = "Nothing to display here yet.",
  ListHeaderComponent,
  contentContainerStyle,
  numColumns,
}: IOdooListProps<T>) {
  const { colors } = useTheme();

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && onEndReached) {
      onEndReached();
    }
  }, [hasMore, isLoadingMore, onEndReached]);

  // Initial loading skeleton
  if (isLoading && (!data || data.length === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {ListHeaderComponent}
        <SkeletonGroup count={6} style={{ padding: SPACING.base }} />
      </View>
    );
  }

  // Empty state
  if (!isLoading && (!data || data.length === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {ListHeaderComponent}
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {emptyTitle}
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
            {emptyMessage}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={estimatedItemSize}
      numColumns={numColumns}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.gold} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING["2xl"],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    paddingVertical: SPACING.base,
    alignItems: "center",
  },
});
