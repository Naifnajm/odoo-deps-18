import { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type { ListRenderItem } from "@shopify/flash-list";

import { useTheme } from "../../theme/theme";
import { SPACING, RADIUS } from "../../theme/spacing";
import {
  useClientDocuments,
  type IClientDocument,
} from "../../hooks/use-client-portal";
import { odooKeys } from "../../hooks/use-odoo-query";
import { OdooList } from "../../components/odoo-list";
import { StatusBadge } from "../../components/status-badge";
import { ScreenHeader } from "../../components/screen-header";

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isRefetching } = useClientDocuments();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: odooKeys.model("ir.attachment") });
  }, [queryClient]);

  const filtered = useMemo(() => {
    const records = data?.records ?? [];
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (d: IClientDocument) => d.name.toLowerCase().includes(q) || (d.description ?? "").toLowerCase().includes(q)
    );
  }, [data?.records, searchQuery]);

  const renderItem: ListRenderItem<IClientDocument> = useCallback(
    ({ item }: { item: IClientDocument }) => <DocumentRow doc={item} />,
    []
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Documents"
        subtitle={`${data?.records?.length ?? 0} files`}
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
          placeholder="Search documents..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
      </View>

      <OdooList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item: IClientDocument) => String(item.id)}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={handleRefresh}
        estimatedItemSize={72}
        emptyTitle="No documents"
        emptyMessage="No documents are shared with your account yet."
      />
    </View>
  );
}

function DocumentRow({ doc }: { doc: IClientDocument }) {
  const { colors } = useTheme();

  const fileIcon = getFileIcon(doc.mimetype);
  const fileSize = formatFileSize(doc.file_size);

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.elevated }]}>
        <Text style={styles.iconText}>{fileIcon}</Text>
      </View>

      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {doc.name}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={[styles.rowDate, { color: colors.textMuted }]}>
            {formatDate(doc.create_date)}
          </Text>
          <Text style={[styles.rowSize, { color: colors.textMuted }]}>{fileSize}</Text>
        </View>
        {doc.description && (
          <Text style={[styles.rowDesc, { color: colors.textMuted }]} numberOfLines={1}>
            {doc.description}
          </Text>
        )}
      </View>

      <StatusBadge
        label={getFileType(doc.mimetype)}
        variant="neutral"
        size="sm"
      />
    </View>
  );
}

function getFileIcon(mimetype: string): string {
  if (mimetype.startsWith("image/")) return "IMG";
  if (mimetype.includes("pdf")) return "PDF";
  if (mimetype.includes("spreadsheet") || mimetype.includes("excel")) return "XLS";
  if (mimetype.includes("document") || mimetype.includes("word")) return "DOC";
  if (mimetype.includes("presentation") || mimetype.includes("powerpoint")) return "PPT";
  if (mimetype.includes("text/")) return "TXT";
  if (mimetype.includes("zip") || mimetype.includes("archive")) return "ZIP";
  return "FILE";
}

function getFileType(mimetype: string): string {
  const parts = mimetype.split("/");
  if (parts.length >= 2) {
    const sub = parts[1].replace(/^vnd\..+\./, "").replace(/\+.*$/, "");
    return sub.toUpperCase().slice(0, 6);
  }
  return "FILE";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowMeta: { flexDirection: "row", gap: SPACING.sm, marginTop: 2 },
  rowDate: { fontSize: 11 },
  rowSize: { fontSize: 11 },
  rowDesc: { fontSize: 12, marginTop: 2, fontStyle: "italic" },
});
