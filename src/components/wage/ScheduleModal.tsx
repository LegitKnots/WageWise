import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import PageSheet from "./PageSheet";
import { Segmented } from "./forms";
import { COLORS } from "./theme";
import type { Schedule } from "types/wageTracker";

/* order matters */
const DOW_KEYS: NonNullable<Schedule["dayOfWeek"]>[] = [
  "sunday","monday","tuesday","wednesday","thursday","friday","saturday"
];
const DOW_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function ScheduleModal({
  visible,
  onClose,
  initial,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  initial: Schedule;
  onSave: (s: Schedule) => void;
}) {
  const [freq, setFreq] = React.useState<Schedule["payFrequency"]>(initial.payFrequency);
  const [dow, setDow] = React.useState<NonNullable<Schedule["dayOfWeek"]>>(initial.dayOfWeek ?? "friday");
  const [dom, setDom] = React.useState(String(initial.dayOfMonth ?? 1));

  // --- Collapsible Biweekly Anchor ---
  const [anchor, setAnchor] = React.useState<Date | null>(
    initial.biweeklyAnchorDate ? new Date(initial.biweeklyAnchorDate) : null
  );
  const [anchorOpen, setAnchorOpen] = React.useState(false);

  // --- Collapsible Time Picker (system) ---
  const initTime = new Date();
  initTime.setSeconds(0, 0);
  initTime.setHours(initial.hour ?? 9, initial.minute ?? 0);
  const [time, setTime] = React.useState<Date>(initTime);
  const [timeOpen, setTimeOpen] = React.useState(false);

  const formattedTime = React.useMemo(
    () =>
      time.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [time]
  );

  return (
    <PageSheet visible={visible} onClose={onClose} title="Edit Schedule">
      <Text style={styles.label}>Pay Frequency</Text>
      <Segmented
        value={freq}
        onChange={(v) => setFreq(v as Schedule["payFrequency"])}
        options={[
          { label: "Weekly", value: "weekly" },
          { label: "Biweekly", value: "biweekly" },
          { label: "Monthly", value: "monthly" },
        ]}
      />

      {freq === "monthly" ? (
        <>
          <Text style={[styles.label, styles.mt8]}>Day of Month (1–31)</Text>
          <TextInput
            style={styles.input}
            value={dom}
            onChangeText={setDom}
            keyboardType="number-pad"
          />
        </>
      ) : (
        <>
          <Text style={[styles.label, styles.mt8]}>Day of Week</Text>
          {/* single-row weekday strip */}
          <View style={styles.stripRow}>
            {DOW_KEYS.map((key, i) => {
              const active = dow === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setDow(key)}
                  style={styles.stripCell}
                  accessibilityRole="button"
                  accessibilityLabel={key[0].toUpperCase() + key.slice(1)}
                >
                  <Text style={[styles.stripText, active && styles.stripTextActive]}>
                    {DOW_LABELS[i]}
                  </Text>
                  <View style={[styles.underline, active && styles.underlineActive]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {freq === "biweekly" && (
        <>
          <Text style={[styles.label, styles.mt8]}>Biweekly Anchor (first known payday)</Text>

          {/* Collapsible anchor selector */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAnchorOpen((v) => !v)}
            style={styles.disclosure}
          >
            <Text style={styles.disclosureText}>
              {anchor ? anchor.toLocaleDateString() : "Set anchor date"}
            </Text>
            <Text style={[styles.chevron, anchorOpen && styles.chevronOpen]}>›</Text>
          </TouchableOpacity>

          {anchorOpen && (
            <View style={styles.mt6}>
              <DateTimePicker
                value={anchor || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "calendar"}
                onChange={(_, d) => d && setAnchor(d)}
              />
            </View>
          )}
        </>
      )}

      {/* Collapsible system time picker */}
      <Text style={[styles.label, styles.mt8]}>Reminder Time</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setTimeOpen((v) => !v)}
        style={styles.disclosure}
      >
        <Text style={styles.disclosureText}>{formattedTime}</Text>
        <Text style={[styles.chevron, timeOpen && styles.chevronOpen]}>›</Text>
      </TouchableOpacity>

      {timeOpen && (
        <View style={styles.mt6}>
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "clock"}
            is24Hour={undefined} /* let the OS decide; set true for forced 24h */
            onChange={(_, d) => {
              if (!d) return;
              // preserve date part; we only care about hh:mm
              const next = new Date(time);
              next.setHours(d.getHours(), d.getMinutes(), 0, 0);
              setTime(next);
            }}
          />
        </View>
      )}

      <View style={styles.actions}>
        <ButtonSecondary onPress={onClose} label="Cancel" />
        <ButtonPrimary
          label="Save"
          onPress={() => {
            onSave({
              payFrequency: freq,
              dayOfWeek: freq !== "monthly" ? dow : undefined,
              dayOfMonth: freq === "monthly" ? Number(dom || 1) : undefined,
              biweeklyAnchorDate:
                freq === "biweekly" && anchor ? anchor.getTime() : undefined,
              hour: time.getHours(),
              minute: time.getMinutes(),
            });
          }}
        />
      </View>
    </PageSheet>
  );
}

/* local buttons */
function ButtonSecondary({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Text onPress={onPress} style={styles.btnSecondaryTextWrapper}>
      <Text style={styles.btnSecondaryText}>{label}</Text>
    </Text>
  );
}
function ButtonPrimary({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Text onPress={onPress} style={styles.btnPrimaryTextWrapper}>
      <Text style={styles.btnPrimaryText}>{label}</Text>
    </Text>
  );
}

/* styles */
const styles = StyleSheet.create({
  label: { fontSize: 13, color: "#374151", fontWeight: "600" },
  mt8: { marginTop: 8 },
  mt6: { marginTop: 6 },

  input: {
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: COLORS.text,
  },

  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },

  /* weekday strip */
  stripRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
    paddingVertical: 4,
  },
  stripCell: { flex: 1, alignItems: "center" },
  stripText: { color: COLORS.text, fontWeight: "700", fontSize: 13, opacity: 0.7 },
  stripTextActive: { opacity: 1 },
  underline: { marginTop: 6, height: 2, width: 0, backgroundColor: "transparent", borderRadius: 2 },
  underlineActive: { width: 20, backgroundColor: COLORS.text },

  /* collapsible fields */
  disclosure: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  disclosureText: { color: COLORS.text, fontWeight: "600" },
  chevron: { transform: [{ rotate: "90deg" }], color: "#6B7280", fontSize: 18 },
  chevronOpen: { transform: [{ rotate: "270deg" }] },

  /* buttons: wrap text with background/border via wrapper, text styles separate */
  btnSecondaryTextWrapper: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  btnSecondaryText: { color: COLORS.text, fontWeight: "600" },

  btnPrimaryTextWrapper: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});
