import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ListRenderItem } from "@shopify/flash-list";

import { useTheme } from "../../../theme/theme";
import { SPACING, RADIUS } from "../../../theme/spacing";
import { useAuthStore } from "../../../stores/auth-store";
import {
  useClientTickets,
  useCreateTicket,
  type IClientTicket,
} from "../../../hooks/use-client-portal";
import { odooKeys } from "../../../hooks/use-odoo-query";
import { OdooList } from "../../../components/odoo-list";
import { StatusBadge } from "../../../components/status-badge";
import { ScreenHeader } from "../../../components/screen-header";

type TFilter = "all" | "open" | "closed";

export default function SupportIndex() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const partnerId = useAuthStore((s) => s.user?.partnerId);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<TFilter>("all");

  const { data, isLoading, isRefetching } = useClientTickets();
  const createTicket = useCreateTicket();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("helpdesk.ticket") });
  }, [queryClient]);

  const handleNewTicket = useCallback(() => {
    Alert.prompt(
      "New Support Ticket",
      "Describe your issue:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: (text) => {
            if (text?.trim()) {
              createTicket.mutate(
                { values: { name: text.trim(), partner_id: partnerId } },
                { onSuccess: () => handleRefresh() }
              );
            }
          },
        },
      ],
      "plain-text"
    );
  }, [partnerId, createTicket, handleRefresh]);

  const filtered = useMemo(() => {
    let records = data?.records ?? [];

    if (filter === "open") records = records.filter((t) => !t.close_date);
    else if (filter === "closed") records = records.filter((t) => !!t.close_date);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter((t) => t.name.toLowerCase().includes(q));
    }

    return records;
  }, [data?.records, filter, searchQuery]);

  const openCount = useMemo(
    () => (data?.records ?? []).filter((t) => !t.close_date).length,
    [data?.records]
  );

  const renderItem: ListRenderItem<IClientTicket> = useCallback(
    ({ item }) => <TicketRow ticket={item} />,
    []
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Support"
        subtitle={`${openCount} open ticket${openCount !== 1 ? "s" : ""}`}
        rightAction={
          <TouchableOpacity onPress={handleNewTicket} activeOpacity={0.7}>
            <Text style={[styles.newBtn, { color: colors.gold }]}>+ New</Text>
          </TouchableOpacity>
        }
      />

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
          placeholder="Search tickets..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
      </View>

      <View style={[styles.filterRow, { borderColor: colors.border }]}>
        {(["all", "open", "closed"] as TFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              { backgroundColor: filter === f ? colors.gold : colors.elevated },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#080C14" : colors.textMuted },
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <OdooList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={80}
        emptyTitle="No tickets"
        emptyMessage="You haven't created any support tickets yet."
      />
    </View>
  );
}

function TicketRow({ ticket }: { ticket: IClientTicket }) {
  const { colors } = useTheme();
  const isClosed = !!ticket.close_date;

  return (
    <TouchableOpacity
      style={[styles.row, { borderColor: colors.border }]}
      onPress={() => router.push(`/(client)/support/${ticket.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {ticket.name}
        </Text>
        <Text style={[styles.rowDate, { color: colors.textMuted }]}>
          {formatDate(ticket.create_date)}
          {ticket.team_id && ` · ${ticket.team_id[1]}`}
        </Text>
        <View style={styles.rowMeta}>
          <StatusBadge
            label={isClosed ? "Closed" : ticket.stage_id[1]}
            variant={isClosed ? "neutral" : "info"}
            size="sm"
          />
          {ticket.priority === "2" && (
            <StatusBadge label="Urgent" variant="danger" size="sm" />
          )}
          {ticket.priority === "3" && (
            <StatusBadge label="High" variant="warning" size="sm" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  newBtn: { fontSize: 14, fontWeight: "700" },
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  filterText: { fontSize: 12, fontWeight: "600" },
  row: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  rowLeft: {},
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowDate: { fontSize: 12, marginTop: 2, marginBottom: SPACING.xs },
  rowMeta: { flexDirection: "row", gap: SPACING.xs },
});
