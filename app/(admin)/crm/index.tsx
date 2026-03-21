import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import {
  useCrmPipeline,
  useMoveLeadStage,
  type ICrmLead,
} from "../../../hooks/use-crm";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { StatusBadge } from "../../../components/status-badge";
import { SkeletonLoader } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";
import { ScreenHeader } from "../../../components/screen-header";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_WIDTH = Math.max(SCREEN_WIDTH * 0.78, 280);

export default function CrmIndex() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { pipeline, isLoading, isError, isRefetching } = useCrmPipeline();
  const moveStage = useMoveLeadStage();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("crm.lead") });
    queryClient.invalidateQueries({ queryKey: odooKeys.model("crm.stage") });
  }, [queryClient]);

  const handleMoveStage = useCallback(
    (lead: ICrmLead, newStageId: number) => {
      moveStage.mutate(
        { ids: [lead.id], values: { stage_id: newStageId } },
        {
          onError: () =>
            Alert.alert("Error", "Failed to move lead. Please try again."),
        }
      );
    },
    [moveStage]
  );

  const filteredPipeline = useMemo(() => {
    if (!searchQuery.trim()) return pipeline;

    const query = searchQuery.toLowerCase();
    return pipeline.map((col) => ({
      ...col,
      items: col.items.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          (lead.partner_name && lead.partner_name.toLowerCase().includes(query)) ||
          (lead.contact_name && lead.contact_name.toLowerCase().includes(query))
      ),
      count: col.items.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          (lead.partner_name && lead.partner_name.toLowerCase().includes(query)) ||
          (lead.contact_name && lead.contact_name.toLowerCase().includes(query))
      ).length,
    }));
  }, [pipeline, searchQuery]);

  if (isError && pipeline.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorFallback title="Unable to load pipeline" onRetry={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="CRM Pipeline"
        subtitle={`${pipeline.reduce((s, c) => s + c.count, 0)} opportunities`}
      />

      {/* Search Bar */}
      <View style={[styles.searchRow, { borderColor: colors.border }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search leads..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
      </View>

      {/* Kanban Columns */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonColumns}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader
                key={i}
                width={COLUMN_WIDTH}
                height={400}
                borderRadius={RADIUS.lg}
              />
            ))}
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={COLUMN_WIDTH + SPACING.md}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.columnsContainer,
            { paddingBottom: insets.bottom + 80 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }
        >
          {filteredPipeline.map((column) => (
            <View
              key={column.id}
              style={[
                styles.column,
                {
                  width: COLUMN_WIDTH,
                  backgroundColor: colors.elevated,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Column Header */}
              <View style={styles.columnHeader}>
                <View style={styles.columnTitleRow}>
                  <Text
                    style={[styles.columnTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {column.title}
                  </Text>
                  {column.isWon && (
                    <StatusBadge label="Won" variant="success" size="sm" />
                  )}
                </View>
                <View style={styles.columnMeta}>
                  <Text style={[styles.columnCount, { color: colors.textMuted }]}>
                    {column.count} deals
                  </Text>
                  <Text style={[styles.columnRevenue, { color: colors.gold }]}>
                    {formatCurrency(column.totalRevenue)}
                  </Text>
                </View>
              </View>

              {/* Cards */}
              <ScrollView
                style={styles.cardsList}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {column.items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    stages={pipeline}
                    currentStageId={column.id}
                    onPress={() => router.push(`/(admin)/crm/${lead.id}`)}
                    onMoveStage={(stageId) => handleMoveStage(lead, stageId)}
                  />
                ))}
                {column.items.length === 0 && (
                  <View style={styles.emptyColumn}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      No leads
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// --- Lead Card ---

interface ILeadCardProps {
  lead: ICrmLead;
  stages: Array<{ id: number; title: string }>;
  currentStageId: number;
  onPress: () => void;
  onMoveStage: (stageId: number) => void;
}

function LeadCard({ lead, stages, currentStageId, onPress, onMoveStage }: ILeadCardProps) {
  const { colors } = useTheme();

  const priorityStars = Number(lead.priority) || 0;
  const priorityLabel =
    priorityStars >= 3 ? "High" : priorityStars >= 2 ? "Medium" : priorityStars >= 1 ? "Low" : undefined;
  const priorityVariant =
    priorityStars >= 3 ? "danger" : priorityStars >= 2 ? "warning" : "neutral";

  const contactName = lead.contact_name || lead.partner_name || (lead.partner_id ? lead.partner_id[1] : "");

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      onLongPress={() => {
        const otherStages = stages.filter((s) => s.id !== currentStageId);
        if (otherStages.length === 0) return;

        Alert.alert(
          "Move to stage",
          `Move "${lead.name}" to:`,
          [
            ...otherStages.map((s) => ({
              text: s.title,
              onPress: () => onMoveStage(s.id),
            })),
            { text: "Cancel", style: "cancel" as const },
          ]
        );
      }}
    >
      {/* Title row */}
      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
        {lead.name}
      </Text>

      {/* Contact */}
      {contactName ? (
        <Text style={[styles.cardContact, { color: colors.textMuted }]} numberOfLines={1}>
          {contactName}
        </Text>
      ) : null}

      {/* Revenue + Probability */}
      <View style={styles.cardMetaRow}>
        {lead.expected_revenue > 0 && (
          <Text style={[styles.cardRevenue, { color: colors.gold }]}>
            {formatCurrency(lead.expected_revenue)}
          </Text>
        )}
        {lead.probability > 0 && (
          <Text style={[styles.cardProb, { color: colors.textMuted }]}>
            {lead.probability}%
          </Text>
        )}
      </View>

      {/* Footer badges */}
      <View style={styles.cardFooter}>
        {priorityLabel && (
          <StatusBadge
            label={priorityLabel}
            variant={priorityVariant as "danger"}
            size="sm"
          />
        )}
        {lead.activity_date_deadline && (
          <Text style={[styles.cardDeadline, { color: colors.textMuted }]}>
            {formatDeadline(lead.activity_date_deadline)}
          </Text>
        )}
        {lead.user_id && (
          <Text style={[styles.cardAssignee, { color: colors.textMuted }]} numberOfLines={1}>
            {lead.user_id[1]}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// --- Helpers ---

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000);

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `${diffDays}d`;
}

// --- Styles ---

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    paddingTop: SPACING.base,
  },
  skeletonColumns: {
    flexDirection: "row",
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  columnsContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  column: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    maxHeight: "100%",
    overflow: "hidden",
  },
  columnHeader: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.md,
  },
  columnTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  columnMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  columnCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  columnRevenue: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardsList: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardContact: {
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  cardRevenue: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardProb: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  cardDeadline: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardAssignee: {
    fontSize: 11,
    fontWeight: "500",
    maxWidth: 80,
  },
  emptyColumn: {
    paddingVertical: SPACING["2xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
