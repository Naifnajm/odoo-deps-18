import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/theme";
import { SPACING, RADIUS } from "../theme/spacing";

// --- Field Types ---

type TFieldType = "text" | "number" | "email" | "phone" | "multiline" | "select" | "date" | "boolean" | "many2one";

interface IBaseField {
  name: string;
  label: string;
  required?: boolean;
  readonly?: boolean;
  placeholder?: string;
}

interface ITextField extends IBaseField {
  type: "text" | "email" | "phone" | "multiline";
}

interface INumberField extends IBaseField {
  type: "number";
}

interface ISelectField extends IBaseField {
  type: "select";
  options: Array<{ value: string | number; label: string }>;
}

interface IDateField extends IBaseField {
  type: "date";
}

interface IBooleanField extends IBaseField {
  type: "boolean";
}

interface IMany2OneField extends IBaseField {
  type: "many2one";
  model: string;
  displayField?: string;
}

type TFormField =
  | ITextField
  | INumberField
  | ISelectField
  | IDateField
  | IBooleanField
  | IMany2OneField;

interface IOdooFormProps {
  fields: TFormField[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  style?: ViewStyle;
}

export function OdooForm({
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel = "Save",
  isLoading = false,
  style,
}: IOdooFormProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {fields.map((field) => (
        <FormField
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={(val: unknown) => onChange(field.name, val)}
        />
      ))}

      {onSubmit && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.gold,
              opacity: isLoading ? 0.6 : 1,
            },
          ]}
          onPress={onSubmit}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.submitText}>{submitLabel}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// --- Individual Field Renderer ---

interface IFormFieldProps {
  key?: React.Key;
  field: TFormField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FormField({ field, value, onChange }: IFormFieldProps) {
  const { colors } = useTheme();

  if (field.type === "boolean") {
    return (
      <View style={styles.booleanRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {field.label}
          {field.required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
        <Switch
          value={Boolean(value)}
          onValueChange={onChange}
          disabled={field.readonly}
          trackColor={{ false: colors.elevated, true: colors.gold }}
          thumbColor="#fff"
        />
      </View>
    );
  }

  if (field.type === "select") {
    const selectField = field as ISelectField;
    return (
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {field.label}
          {field.required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectField.options.map((opt) => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[
                styles.selectChip,
                {
                  backgroundColor:
                    value === opt.value ? colors.gold : colors.elevated,
                  borderColor:
                    value === opt.value ? colors.gold : colors.border,
                },
              ]}
              onPress={() => onChange(opt.value)}
              disabled={field.readonly}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectChipText,
                  {
                    color: value === opt.value ? "#080C14" : colors.text,
                    fontWeight: value === opt.value ? "700" : "400",
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Text-based fields
  const isMultiline = field.type === "multiline";
  const keyboardType =
    field.type === "number"
      ? "numeric" as const
      : field.type === "email"
        ? "email-address" as const
        : field.type === "phone"
          ? "phone-pad" as const
          : "default" as const;

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        {field.label}
        {field.required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          isMultiline && styles.multilineInput,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: colors.border,
          },
          field.readonly && { opacity: 0.6 },
        ]}
        value={String(value ?? "")}
        onChangeText={(text: string) =>
          onChange(field.type === "number" ? Number(text) || 0 : text)
        }
        placeholder={field.placeholder ?? field.label}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        editable={!field.readonly}
        multiline={isMultiline}
        numberOfLines={isMultiline ? 4 : 1}
        textAlignVertical={isMultiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.base,
    fontSize: 15,
  },
  multilineInput: {
    height: 100,
    paddingTop: SPACING.md,
  },
  booleanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  selectChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  selectChipText: {
    fontSize: 14,
  },
  submitButton: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.base,
    marginBottom: SPACING["2xl"],
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#080C14",
  },
});

export type { TFormField, TFieldType };
