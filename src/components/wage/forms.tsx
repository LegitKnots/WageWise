import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS } from "./theme";

/* --------------------------- FormText --------------------------- */
export function FormText({
  label,
  value,
  onChange,
  placeholder,
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

/* --------------------------- FormNumber --------------------------- */
export function FormNumber({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />
    </View>
  );
}

/* --------------------------- InlineDate --------------------------- */
export function InlineDate({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (d: Date | null) => void;
}) {
  const [show, setShow] = useState(false);
  const dateLabel = value ? value.toLocaleDateString() : "Select date";

  return (
    <View style={styles.dateContainer}>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShow(true)}>
        <Text style={styles.dateText}>{dateLabel}</Text>
        <Text style={styles.dateArrow}>▸</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          onChange={(_, d) => {
            setShow(Platform.OS === "ios");
            onChange(d || value || new Date());
          }}
        />
      )}
    </View>
  );
}

/* --------------------------- Segmented --------------------------- */
export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* --------------------------- PillRow --------------------------- */
export function PillRow({
  valueSet,
  options,
  onToggle,
  single = false,
}: {
  valueSet: Set<string>;
  options: { label: string; key: string }[];
  onToggle: (key: string) => void;
  single?: boolean;
}) {
  return (
    <View style={styles.pillRow}>
      {options.map((o) => {
        const active = valueSet.has(o.key);
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => {
              if (single) {
                valueSet.clear();
                valueSet.add(o.key);
              }
              onToggle(o.key);
            }}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* --------------------------- ColorSwatches --------------------------- */
export function ColorSwatches({
  colors,
  value,
  onChange,
  extra,
}: {
  colors: string[];
  value: string;
  onChange: (c: string) => void;
  extra?: React.ReactNode; // e.g., a custom-hex input toggle
}) {
  return (
    <View style={styles.swatchesContainer}>
      <View style={styles.swatchesRow}>
        {colors.map((c) => {
          const selected = value === c;
          // dynamic parts computed in variables (not inline in JSX)
          const swatchDynamic: StyleProp<ViewStyle> = {
            backgroundColor: c,
            borderColor: selected ? c : "#fff",
          };
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onChange(c)}
              style={[styles.swatch, swatchDynamic, selected && styles.swatchSelected]}
            />
          );
        })}
        {extra}
      </View>
    </View>
  );
}

/* --------------------------- Divider --------------------------- */
export function Divider() {
  return <View style={styles.divider} />;
}

/* =========================== styles =========================== */
const styles = StyleSheet.create({
  row: { gap: 6, marginBottom: 10 },
  label: { fontSize: 13, color: "#374151", fontWeight: "600" },

  input: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: COLORS.text,
  },

  /* InlineDate */
  dateContainer: { gap: 6 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dateText: { color: COLORS.text, fontWeight: "600" },
  dateArrow: { color: COLORS.muted },

  /* Segmented */
  segment: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentItemActive: { backgroundColor: COLORS.text },
  segmentLabel: { color: COLORS.text, fontWeight: "700" },
  segmentLabelActive: { color: "#fff" },

  /* PillRow */
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
  },
  pillActive: { backgroundColor: COLORS.text },
  pillText: { color: COLORS.text, fontWeight: "600" },
  pillTextActive: { color: "#fff" },

  /* ColorSwatches */
  swatchesContainer: { gap: 8 },
  swatchesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 2 },
  swatchSelected: {},

  /* Divider */
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
});
