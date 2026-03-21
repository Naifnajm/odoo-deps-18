import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

interface IChatterMessage {
  id: number;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  date: string;
  messageType: "comment" | "notification" | "email";
  subtypeDescription?: string;
}

interface IOdooChatterProps {
  messages: IChatterMessage[];
  isLoading?: boolean;
  onSendMessage?: (body: string) => void;
  onLogNote?: (body: string) => void;
  isSending?: boolean;
  style?: ViewStyle;
}

export function OdooChatter({
  messages,
  isLoading: _isLoading = false,
  onSendMessage,
  onLogNote,
  isSending = false,
  style,
}: IOdooChatterProps) {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"message" | "note">("message");

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    if (mode === "message") {
      onSendMessage?.(text);
    } else {
      onLogNote?.(text);
    }
    setInputText("");
  }, [inputText, mode, onSendMessage, onLogNote]);

  const renderMessage = useCallback(
    ({ item }: { item: IChatterMessage }) => (
      <View style={[styles.messageRow, { borderColor: colors.border }]}>
        <View style={styles.avatarCol}>
          {item.authorAvatarUrl ? (
            <Image
              source={{ uri: item.authorAvatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.elevated }]}>
              <Text style={[styles.avatarInitial, { color: colors.textMuted }]}>
                {item.authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
              {item.authorName}
            </Text>
            <Text style={[styles.messageDate, { color: colors.textMuted }]}>
              {item.date}
            </Text>
          </View>
          {item.subtypeDescription && (
            <Text style={[styles.subtypeLabel, { color: colors.blue }]}>
              {item.subtypeDescription}
            </Text>
          )}
          <Text style={[styles.messageBody, { color: colors.text }]}>
            {stripHtml(item.body)}
          </Text>
        </View>
      </View>
    ),
    [colors]
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Chatter</Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {messages.length}
        </Text>
      </View>

      {/* Input Section */}
      {(onSendMessage || onLogNote) && (
        <View style={[styles.inputSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "message" && { backgroundColor: colors.blue },
              ]}
              onPress={() => setMode("message")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: mode === "message" ? "#fff" : colors.textMuted },
                ]}
              >
                Message
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "note" && { backgroundColor: colors.gold },
              ]}
              onPress={() => setMode("note")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modeText,
                  { color: mode === "note" ? "#080C14" : colors.textMuted },
                ]}
              >
                Log Note
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                mode === "message"
                  ? "Write a message..."
                  : "Log an internal note..."
              }
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={5000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: mode === "message" ? colors.blue : colors.gold,
                  opacity: !inputText.trim() || isSending ? 0.5 : 1,
                },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.7}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Messages */}
      <FlashList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item: IChatterMessage) => String(item.id)}
        estimatedItemSize={100}
        scrollEnabled={false}
      />
    </View>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  count: {
    fontSize: 14,
  },
  inputSection: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  modeToggle: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  modeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    textAlignVertical: "top",
  },
  sendButton: {
    height: 40,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#080C14",
  },
  messageRow: {
    flexDirection: "row",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  avatarCol: {
    width: 36,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "700",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  messageDate: {
    fontSize: 11,
    marginLeft: SPACING.sm,
  },
  subtypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  messageBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
