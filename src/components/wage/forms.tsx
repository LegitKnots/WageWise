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
import { useTheme } from "context/ThemeContext";
import { COLORS } from "constants/colors";


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
  const { colors } = useTheme();
  
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text 
        }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={colors.textMuted}
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
  const { colors } = useTheme();
  
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          color: colors.text 
        }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
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
  const { colors } = useTheme();
  const [show, setShow] = useState(false);
  const dateLabel = value ? value.toLocaleDateString() : "Select date";

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const togglePicker = () => {
    setShow(!show);
  };

  return (
    <View style={styles.dateContainer}>
      <TouchableOpacity 
        style={[styles.dateBtn, { 
          backgroundColor: colors.card,
          borderColor: colors.border 
        }]} 
        onPress={togglePicker}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>{dateLabel}</Text>
        <Text style={[styles.dateArrow, show && styles.dateArrowOpen, { color: colors.textMuted }]}>
          ›
        </Text>
      </TouchableOpacity>
      {show && (
        <View style={[styles.datePickerContainer, { 
          backgroundColor: colors.card,
          borderColor: colors.border 
        }]}>
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "calendar"}
            onChange={handleDateChange}
            textColor={colors.text}
            themeVariant={colors.background === '#111827' ? "dark" : "light"}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity 
              style={[styles.datePickerClose, { backgroundColor: colors.primary }]} 
              onPress={() => setShow(false)}
            >
              <Text style={styles.datePickerCloseText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
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
  const { colors } = useTheme();
  
  return (
    <View style={[styles.segment, { backgroundColor: colors.surface }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segmentItem, active && { backgroundColor: colors.primary }]}
          >
            <Text style={[
              styles.segmentLabel, 
              { color: active ? COLORS.white : colors.text }
            ]}>
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
  const { colors } = useTheme();
  
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
            style={[
              styles.pill, 
              { backgroundColor: colors.surface },
              active && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.pillText, 
              { color: active ? COLORS.white : colors.text }
            ]}>
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
  const { colors: themeColors } = useTheme();
  
  return (
    <View style={styles.swatchesContainer}>
      <View style={styles.swatchesRow}>
        {colors.map((c) => {
          const selected = value === c;
          // dynamic parts computed in variables (not inline in JSX)
          const swatchDynamic: StyleProp<ViewStyle> = {
            backgroundColor: c,
            borderColor: selected ? c : themeColors.card,
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

/* --------------------------- EmployerDropdown --------------------------- */
export function EmployerDropdown({
  employers,
  selectedId,
  onSelect,
  placeholder = "Select employer",
}: {
  employers: Array<{ id: string; name: string; color: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedEmployer = employers.find(emp => emp.id === selectedId);
  
  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[styles.dropdownButton, { 
          backgroundColor: colors.card,
          borderColor: colors.border 
        }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.dropdownContent}>
          {selectedEmployer ? (
            <>
              <View style={[styles.colorDot, { backgroundColor: selectedEmployer.color }]} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {selectedEmployer.name}
              </Text>
            </>
          ) : (
            <Text style={[styles.dropdownText, { color: colors.textMuted }]}>
              {placeholder}
            </Text>
          )}
        </View>
        <Text style={[styles.dropdownArrow, isOpen && styles.dropdownArrowOpen, { color: colors.textMuted }]}>
          ›
        </Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={[styles.dropdownList, { 
          backgroundColor: colors.card,
          borderColor: colors.border 
        }]}>
          {employers.map((employer) => (
            <TouchableOpacity
              key={employer.id}
              style={[styles.dropdownItem, { 
                backgroundColor: selectedId === employer.id ? colors.primary : 'transparent' 
              }]}
              onPress={() => {
                onSelect(employer.id);
                setIsOpen(false);
              }}
            >
              <View style={styles.dropdownContent}>
                <View style={[styles.colorDot, { backgroundColor: employer.color }]} />
                <Text style={[styles.dropdownItemText, { 
                  color: selectedId === employer.id ? COLORS.white : colors.text 
                }]}>
                  {employer.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* --------------------------- Divider --------------------------- */
export function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

/* =========================== styles =========================== */
const styles = StyleSheet.create({
  row: { gap: 12, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  /* InlineDate */
  dateContainer: { gap: 6 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dateText: { fontWeight: "600" },
  dateArrow: { fontSize: 18 },
  dateArrowOpen: { transform: [{ rotate: "90deg" }] },
  datePickerContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
  },
  datePickerClose: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
  },
  datePickerCloseText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  /* Segmented */
  segment: {
    flexDirection: "row",
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
  segmentLabel: { fontWeight: "700" },

  /* PillRow */
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pillText: { fontWeight: "600" },

  /* ColorSwatches */
  swatchesContainer: { gap: 12 },
  swatchesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: { width: 32, height: 32, borderRadius: 8, borderWidth: 2 },
  swatchSelected: {},

  /* Divider */
  divider: { height: 1, marginVertical: 16 },

  /* EmployerDropdown */
  dropdownContainer: { position: "relative" },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dropdownText: { fontWeight: "600", flex: 1 },
  dropdownArrow: { fontSize: 18 },
  dropdownArrowOpen: { transform: [{ rotate: "90deg" }] },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dropdownItemText: { fontWeight: "600" },
});
