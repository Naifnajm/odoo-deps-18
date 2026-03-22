import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";
import { odooRpc } from "../services/odoo-rpc";
import { useQueryClient } from "@tanstack/react-query";

// Quick-create presets for common Odoo models
const QUICK_CREATE_MODELS = [
  { model: "crm.lead", label: "Lead / Opportunity", icon: "\uD83E\uDD1D", nameField: "name" },
  { model: "project.task", label: "Task", icon: "\uD83D\uDCCB", nameField: "name" },
  { model: "sale.order", label: "Quotation", icon: "\uD83D\uDCB0", nameField: "name" },
  { model: "helpdesk.ticket", label: "Ticket", icon: "\uD83C\uDFAB", nameField: "name" },
  { model: "hr.leave", label: "Leave Request", icon: "\uD83C\uDFD6\uFE0F", nameField: "name" },
  { model: "calendar.event", label: "Event", icon: "\uD83D\uDCC5", nameField: "name" },
  { model: "note.note", label: "Note", icon: "\uD83D\uDDD2\uFE0F", nameField: "name" },
  { model: "res.partner", label: "Contact", icon: "\uD83D\uDCD6", nameField: "name" },
];

interface QuickCreateProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickCreate({ visible, onClose }: QuickCreateProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [selectedModel, setSelectedModel] = useState<
    (typeof QUICK_CREATE_MODELS)[number] | null
  >(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setSelectedModel(null);
    setName("");
    setDescription("");
    setError(null);
    setSuccess(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleCreate = useCallback(async () => {
    if (!selectedModel || !name.trim()) {
      setError("Please enter a name");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const values: Record<string, unknown> = {
        [selectedModel.nameField]: name.trim(),
      };

      // Add description if supported
      if (description.trim()) {
        if (selectedModel.model === "note.note") {
          values.memo = description.trim();
        } else {
          values.description = description.trim();
        }
      }

      const recordId = await odooRpc.create(selectedModel.model, values);

      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({
        queryKey: ["odoo", selectedModel.model],
      });

      setSuccess(`${selectedModel.label} created successfully!`);

      // Auto-close and navigate after short delay
      setTimeout(() => {
        handleClose();
        const baseUrl = odooRpc.getBaseUrl();
        const url = `${baseUrl}/web#model=${selectedModel.model}&id=${recordId}&view_type=form`;
        router.push({
          pathname: "/(main)/webview",
          params: { url, title: selectedModel.label },
        } as never);
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create record"
      );
    } finally {
      setIsCreating(false);
    }
  }, [selectedModel, name, description, queryClient, handleClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              Quick Create
            </Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Text style={[styles.closeButton, { color: colors.textMuted }]}>
                {"\u2715"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {!selectedModel ? (
              // Model selection grid
              <View style={styles.modelGrid}>
                {QUICK_CREATE_MODELS.map((m) => (
                  <TouchableOpacity
                    key={m.model}
                    style={[
                      styles.modelCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedModel(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modelIcon}>{m.icon}</Text>
                    <Text
                      style={[styles.modelLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // Create form
              <View style={styles.form}>
                <TouchableOpacity
                  style={styles.backRow}
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.backText, { color: colors.blue }]}>
                    {"\u2190"} Back
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.selectedModelBadge,
                    { backgroundColor: colors.elevated },
                  ]}
                >
                  <Text style={styles.selectedModelIcon}>
                    {selectedModel.icon}
                  </Text>
                  <Text
                    style={[
                      styles.selectedModelLabel,
                      { color: colors.text },
                    ]}
                  >
                    New {selectedModel.label}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError(null);
                    }}
                    placeholder={`Enter ${selectedModel.label.toLowerCase()} name`}
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>
                    Description
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Optional description..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {error && (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {error}
                  </Text>
                )}

                {success && (
                  <Text style={[styles.successText, { color: colors.success }]}>
                    {success}
                  </Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.createButton,
                    {
                      backgroundColor: colors.gold,
                      opacity: isCreating ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleCreate}
                  disabled={isCreating}
                  activeOpacity={0.7}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#080C14" size="small" />
                  ) : (
                    <Text style={styles.createButtonText}>Create</Text>
                  )}
                </TouchableOpacity>

                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  You can edit all fields after creation in Odoo
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "80%",
    minHeight: "50%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700" },
  closeButton: { fontSize: 20 },
  sheetContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING["3xl"],
  },

  modelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  modelCard: {
    width: "47%",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.base,
    alignItems: "center",
    gap: SPACING.sm,
  },
  modelIcon: { fontSize: 28 },
  modelLabel: { fontSize: 13, fontWeight: "600" },

  form: { gap: SPACING.base },
  backRow: { marginBottom: SPACING.sm },
  backText: { fontSize: 14, fontWeight: "600" },

  selectedModelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  selectedModelIcon: { fontSize: 24 },
  selectedModelLabel: { fontSize: 16, fontWeight: "600" },

  fieldGroup: { gap: SPACING.xs },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.base,
    fontSize: 15,
  },
  textArea: {
    height: 90,
    paddingTop: SPACING.md,
  },

  errorText: { fontSize: 13, textAlign: "center" },
  successText: { fontSize: 14, fontWeight: "600", textAlign: "center" },

  createButton: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: { fontSize: 16, fontWeight: "700", color: "#080C14" },

  hint: { fontSize: 12, textAlign: "center" },
});
