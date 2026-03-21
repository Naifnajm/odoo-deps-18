import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import {
  useCrmLeadDetail,
  useCrmStages,
  useUpdateLead,
  type ICrmLeadDetail,
  type ICrmStage,
} from "../../../hooks/use-crm";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { ProgressRing } from "../../../components/progress-ring";
import { SkeletonGroup } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";

export default function CrmDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leadId = Number(id) || 0;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: lead, isLoading, isError, refetch } = useCrmLeadDetail(leadId);
  const stages = useCrmStages();
  const updateLead = useUpdateLead();

  const handleChangeStage = useCallback(() => {
    if (!stages.data?.records || !lead) return;

    Alert.alert(
      "Change Stage",
      `Current: ${lead.stage_id[1]}`,
      [
        ...stages.data.records
          .filter((s) => s.id !== lead.stage_id[0])
          .map((s) => ({
            text: s.name,
            onPress: () =>
              updateLead.mutate({ ids: [leadId], values: { stage_id: s.id } }),
          })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  }, [stages.data, lead, leadId, updateLead]);

  const handleChangePriority = useCallback(() => {
    if (!lead) return;
    Alert.alert("Set Priority", undefined, [
      { text: "Normal", onPress: () => updateLead.mutate({ ids: [leadId], values: { priority: "0" } }) },
      { text: "Low", onPress: () => updateLead.mutate({ ids: [leadId], values: { priority: "1" } }) },
      { text: "Medium", onPress: () => updateLead.mutate({ ids: [leadId], values: { priority: "2" } }) },
      { text: "High", onPress: () => updateLead.mutate({ ids: [leadId], values: { priority: "3" } }) },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [lead, leadId, updateLead]);

  if (isError && !lead) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Lead" showBack />
        <ErrorFallback title="Lead not found" onRetry={() => refetch()} />
      </View>
    );
  }

  if (isLoading || !lead) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Loading..." showBack />
        <SkeletonGroup count={6} style={{ padding: SPACING.xl }} />
      </View>
    );
  }

  const priorityStars = Number(lead.priority) || 0;
  const priorityLabel =
    priorityStars >= 3 ? "High" : priorityStars >= 2 ? "Medium" : priorityStars >= 1 ? "Low" : "Normal";
  const priorityVariant =
    priorityStars >= 3 ? "danger" : priorityStars >= 2 ? "warning" : priorityStars >= 1 ? "info" : "neutral";

  const contactName = lead.contact_name || lead.partner_name || (lead.partner_id ? lead.partner_id[1] : "");
  const hasContactInfo = lead.email_from || lead.phone || lead.mobile;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={lead.name}
        subtitle={lead.stage_id[1]}
        showBack
        rightAction={
          <TouchableOpacity onPress={handleChangeStage} activeOpacity={0.7}>
            <Text style={[styles.actionText, { color: colors.gold }]}>
              Move Stage
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Stats Row */}
        <View style={styles.statsRow}>
          {/* Probability Ring */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ProgressRing
              progress={lead.probability}
              size={56}
              strokeWidth={5}
            />
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Probability
            </Text>
          </View>

          {/* Revenue */}
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.revenueValue, { color: colors.gold }]}>
              {formatCurrency(lead.expected_revenue)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Expected Revenue
            </Text>
          </View>
        </View>

        {/* Stage + Priority */}
        <View style={styles.badgeRow}>
          <TouchableOpacity onPress={handleChangeStage} activeOpacity={0.7}>
            <StatusBadge label={lead.stage_id[1]} variant="gold" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePriority} activeOpacity={0.7}>
            <StatusBadge
              label={priorityLabel}
              variant={priorityVariant as "danger"}
            />
          </TouchableOpacity>
          <StatusBadge
            label={lead.type === "opportunity" ? "Opportunity" : "Lead"}
            variant="info"
          />
        </View>

        {/* Contact Info Section */}
        <SectionCard title="Contact" colors={colors}>
          <InfoRow label="Contact" value={contactName} colors={colors} />
          {lead.partner_id && (
            <InfoRow label="Company" value={lead.partner_id[1]} colors={colors} />
          )}
          {lead.function && (
            <InfoRow label="Job Title" value={lead.function} colors={colors} />
          )}
          {lead.email_from && (
            <InfoRow
              label="Email"
              value={lead.email_from}
              colors={colors}
              onPress={() => Linking.openURL(`mailto:${lead.email_from}`)}
            />
          )}
          {lead.phone && (
            <InfoRow
              label="Phone"
              value={lead.phone}
              colors={colors}
              onPress={() => Linking.openURL(`tel:${lead.phone}`)}
            />
          )}
          {lead.mobile && (
            <InfoRow
              label="Mobile"
              value={lead.mobile}
              colors={colors}
              onPress={() => Linking.openURL(`tel:${lead.mobile}`)}
            />
          )}
          {lead.website && (
            <InfoRow
              label="Website"
              value={lead.website}
              colors={colors}
              onPress={() => {
                const url = lead.website!.startsWith("http")
                  ? lead.website!
                  : `https://${lead.website}`;
                Linking.openURL(url);
              }}
            />
          )}
        </SectionCard>

        {/* Location */}
        {(lead.street || lead.city || lead.country_id) && (
          <SectionCard title="Location" colors={colors}>
            {lead.street && (
              <InfoRow label="Street" value={lead.street} colors={colors} />
            )}
            {lead.street2 && (
              <InfoRow label="" value={lead.street2} colors={colors} />
            )}
            {lead.city && (
              <InfoRow label="City" value={lead.city} colors={colors} />
            )}
            {lead.state_id && (
              <InfoRow label="State" value={lead.state_id[1]} colors={colors} />
            )}
            {lead.zip && (
              <InfoRow label="Zip" value={lead.zip} colors={colors} />
            )}
            {lead.country_id && (
              <InfoRow label="Country" value={lead.country_id[1]} colors={colors} />
            )}
          </SectionCard>
        )}

        {/* Dates & Timeline */}
        <SectionCard title="Timeline" colors={colors}>
          <InfoRow label="Created" value={formatDate(lead.create_date)} colors={colors} />
          {lead.date_open && (
            <InfoRow label="Assigned" value={formatDate(lead.date_open)} colors={colors} />
          )}
          {lead.date_deadline && (
            <InfoRow label="Deadline" value={formatDate(lead.date_deadline)} colors={colors} />
          )}
          {lead.date_closed && (
            <InfoRow label="Closed" value={formatDate(lead.date_closed)} colors={colors} />
          )}
          {lead.day_open > 0 && (
            <InfoRow label="Days to Assign" value={`${lead.day_open}d`} colors={colors} />
          )}
          {lead.day_close > 0 && (
            <InfoRow label="Days to Close" value={`${lead.day_close}d`} colors={colors} />
          )}
        </SectionCard>

        {/* Description */}
        {lead.description && (
          <SectionCard title="Internal Notes" colors={colors}>
            <Text style={[styles.description, { color: colors.text }]}>
              {stripHtml(lead.description)}
            </Text>
          </SectionCard>
        )}

        {/* Assigned To */}
        {lead.user_id && (
          <SectionCard title="Assigned To" colors={colors}>
            <InfoRow label="Salesperson" value={lead.user_id[1]} colors={colors} />
          </SectionCard>
        )}

        {/* Lost Reason */}
        {lead.lost_reason_id && (
          <SectionCard title="Lost Reason" colors={colors}>
            <StatusBadge label={lead.lost_reason_id[1]} variant="danger" />
          </SectionCard>
        )}

        {/* Quick Actions */}
        {hasContactInfo && (
          <View style={styles.quickActions}>
            {lead.phone && (
              <ActionButton
                label="Call"
                colors={colors}
                color={colors.success}
                onPress={() => Linking.openURL(`tel:${lead.phone}`)}
              />
            )}
            {lead.email_from && (
              <ActionButton
                label="Email"
                colors={colors}
                color={colors.blue}
                onPress={() => Linking.openURL(`mailto:${lead.email_from}`)}
              />
            )}
            {(lead.phone || lead.mobile) && (
              <ActionButton
                label="WhatsApp"
                colors={colors}
                color={colors.success}
                onPress={() => {
                  const phone = (lead.mobile || lead.phone || "").replace(/[^0-9+]/g, "");
                  Linking.openURL(`https://wa.me/${phone}`);
                }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// --- Sub-components ---

function SectionCard({
  title,
  colors,
  children,
}: {
  title: string;
  colors: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
  onPress,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
  onPress?: () => void;
}) {
  if (!value) return null;

  const content = (
    <View style={styles.infoRow}>
      {label ? (
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      ) : null}
      <Text
        style={[
          styles.infoValue,
          { color: onPress ? colors.blue : colors.text },
          !label && { flex: 1 },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function ActionButton({
  label,
  color,
  colors,
  onPress,
}: {
  label: string;
  color: string;
  colors: Record<string, string>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// --- Helpers ---

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// --- Styles ---

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.base,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.base,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  revenueValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Badges
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  // Section
  sectionCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: SPACING.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Info Rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: SPACING.xs,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  // Description
  description: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
