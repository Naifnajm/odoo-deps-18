import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import { useClientTicketDetail } from "../../../hooks/use-client-portal";
import { ScreenHeader } from "../../../components/screen-header";
import { StatusBadge } from "../../../components/status-badge";
import { SkeletonGroup } from "../../../components/skeleton-loader";
import { ErrorFallback } from "../../../components/error-boundary";

export default function SupportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticketId = Number(id) || 0;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: ticket, isLoading, isError, refetch } = useClientTicketDetail(ticketId);

  if (isError && !ticket) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Ticket" showBack />
        <ErrorFallback title="Ticket not found" onRetry={() => refetch()} />
      </View>
    );
  }

  if (isLoading || !ticket) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Loading..." showBack />
        <SkeletonGroup count={5} style={{ padding: SPACING.xl }} />
      </View>
    );
  }

  const isClosed = !!ticket.close_date;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={`#${ticket.id}`}
        subtitle={ticket.name}
        showBack
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badges */}
        <View style={styles.badgeRow}>
          <StatusBadge
            label={isClosed ? "Closed" : "Open"}
            variant={isClosed ? "neutral" : "success"}
          />
          <StatusBadge label={ticket.stage_id[1]} variant="gold" />
          {ticket.priority === "2" && <StatusBadge label="Urgent" variant="danger" />}
          {ticket.priority === "3" && <StatusBadge label="High" variant="warning" />}
        </View>

        {/* Subject card */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subject</Text>
          <Text style={[styles.subjectText, { color: colors.text }]}>{ticket.name}</Text>
        </View>

        {/* Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <InfoRow label="Created" value={formatDateTime(ticket.create_date)} colors={colors} />
          {ticket.assign_date && (
            <InfoRow label="Assigned" value={formatDateTime(ticket.assign_date)} colors={colors} />
          )}
          {ticket.close_date && (
            <InfoRow label="Closed" value={formatDateTime(ticket.close_date)} colors={colors} />
          )}
          {ticket.user_id && (
            <InfoRow label="Assigned To" value={ticket.user_id[1]} colors={colors} />
          )}
          {ticket.team_id && (
            <InfoRow label="Team" value={ticket.team_id[1]} colors={colors} />
          )}
          {ticket.sla_deadline && (
            <InfoRow label="SLA Deadline" value={formatDateTime(ticket.sla_deadline)} colors={colors} />
          )}
        </View>

        {/* Description */}
        {ticket.description && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descText, { color: colors.textMuted }]}>
              {stripHtml(ticket.description)}
            </Text>
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.timeline, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Timeline</Text>
          <TimelineEntry
            label="Created"
            date={ticket.create_date}
            colors={colors}
            isFirst
          />
          {ticket.assign_date && (
            <TimelineEntry
              label="Assigned"
              date={ticket.assign_date}
              detail={ticket.user_id ? ticket.user_id[1] : undefined}
              colors={colors}
            />
          )}
          {ticket.close_date && (
            <TimelineEntry
              label="Closed"
              date={ticket.close_date}
              colors={colors}
              isLast
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function TimelineEntry({
  label,
  date,
  detail,
  colors,
  isFirst = false,
  isLast = false,
}: {
  label: string;
  date: string;
  detail?: string;
  colors: Record<string, string>;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineDotCol}>
        {!isFirst && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
        <View style={[styles.timelineDot, { backgroundColor: colors.gold }]} />
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
          {formatDateTime(date)}
        </Text>
        {detail && (
          <Text style={[styles.timelineDetail, { color: colors.textMuted }]}>{detail}</Text>
        )}
      </View>
    </View>
  );
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.base },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },

  section: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: SPACING.md },
  subjectText: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  descText: { fontSize: 14, lineHeight: 20 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "600" },

  timeline: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 48,
  },
  timelineDotCol: {
    width: 24,
    alignItems: "center",
  },
  timelineLine: {
    flex: 1,
    width: 2,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  timelineLabel: { fontSize: 14, fontWeight: "600" },
  timelineDate: { fontSize: 12, marginTop: 1 },
  timelineDetail: { fontSize: 12, marginTop: 1 },
});
