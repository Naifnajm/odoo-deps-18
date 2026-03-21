import { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_WIDTH = SCREEN_WIDTH * 0.75;
const MIN_COLUMN_WIDTH = 280;

interface IKanbanColumn<T> {
  id: string | number;
  title: string;
  count?: number;
  items: T[];
}

interface IOdooKanbanProps<T> {
  columns: IKanbanColumn<T>[];
  renderCard: (item: T, columnId: string | number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onCardPress?: (item: T) => void;
  onMoveCard?: (item: T, fromColumn: string | number, toColumn: string | number) => void;
  columnWidth?: number;
  style?: ViewStyle;
}

export function OdooKanban<T>({
  columns,
  renderCard,
  keyExtractor,
  onCardPress,
  columnWidth = Math.max(COLUMN_WIDTH, MIN_COLUMN_WIDTH),
  style,
}: IOdooKanbanProps<T>) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={columnWidth + SPACING.md}
      decelerationRate="fast"
      contentContainerStyle={[styles.scrollContent, style]}
    >
      {columns.map((column) => (
        <View
          key={String(column.id)}
          style={[
            styles.column,
            {
              width: columnWidth,
              backgroundColor: colors.elevated,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.columnHeader}>
            <Text
              style={[styles.columnTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {column.title}
            </Text>
            {column.count !== undefined && (
              <View
                style={[styles.countBadge, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {column.count}
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.cardList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {column.items.map((item) => (
              <TouchableOpacity
                key={keyExtractor(item)}
                style={[
                  styles.cardWrapper,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => onCardPress?.(item)}
                activeOpacity={0.7}
              >
                {renderCard(item, column.id)}
              </TouchableOpacity>
            ))}
            {column.items.length === 0 && (
              <View style={styles.emptyColumn}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No items
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    gap: SPACING.md,
  },
  column: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: "hidden",
    maxHeight: "100%",
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  columnTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.sm,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardList: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  cardWrapper: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyColumn: {
    paddingVertical: SPACING["2xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
