import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from "react-native";
import PageSheet from "./PageSheet";
import { FormText, FormNumber, Segmented, PillRow, ColorSwatches } from "./forms";
import { COLORS } from "./theme";
import type { PayStructure } from "types/wageTracker";

const PRESET_COLORS = [
  "#007AFF", "#22C55E", "#EF4444", "#8B5CF6", "#F59E0B",
  "#06B6D4", "#EC4899", "#3F3F46", "#0EA5E9", "#10B981",
];

export type EmployerEditorPayload = {
  name: string;
  color: string;
  payStructure: PayStructure;
};

const PRESET_EXTRA_OPTIONS = [
  { label: "Commission", key: "commission:Commission" as const },
  { label: "Tips",       key: "tips:Tips" as const },
  { label: "Bonus",      key: "bonus:Bonus" as const },
];

export default function EmployerEditorModal({
  visible,
  onClose,
  initial,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  initial?: EmployerEditorPayload;
  onSave: (payload: EmployerEditorPayload) => void;
}) {
  /** -------- memoized initial primitives so deps stay simple & stable -------- */
  const initialName = useMemo(() => initial?.name ?? "", [initial?.name]);
  const initialColor = useMemo(() => initial?.color ?? PRESET_COLORS[0], [initial?.color]);
  const initialBase = useMemo<PayStructure["base"]>(
    () => (initial?.payStructure.base ?? "hourly") as PayStructure["base"],
    [initial?.payStructure?.base]
  );
  // Memoize the *array instance* so eslint is happy including it in deps.
  const initialExtrasRaw = initial?.payStructure?.extras;
  const initialExtras = useMemo(
    () => (initialExtrasRaw ? initialExtrasRaw : []),
    [initialExtrasRaw]
  );
  const initialDefaultRate = useMemo(
    () => initial?.payStructure?.defaultRate ?? 0,
    [initial?.payStructure?.defaultRate]
  );

  /** -------- local state -------- */
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [base, setBase] = useState<PayStructure["base"]>(initialBase);
  const [extras, setExtras] = useState<PayStructure["extras"]>(initialExtras);
  const [defaultRate, setDefaultRate] = useState(String(initialDefaultRate));

  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

  /** -------- reset form when modal opens or initial changes -------- */
  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setColor(initialColor);
    setBase(initialBase);
    setExtras(initialExtras);
    setDefaultRate(String(initialDefaultRate));
    setCustomOpen(false);
    setCustomLabel("");
  }, [visible, initialName, initialColor, initialBase, initialExtras, initialDefaultRate]);

  /** -------- options & selection -------- */
  const valueSet = useMemo(
    () => new Set(extras.map((x) => `${x.kind}:${x.label}`)),
    [extras]
  );

  const options: { label: string; key: string }[] = useMemo(() => {
    const seen = new Set(PRESET_EXTRA_OPTIONS.map((o) => o.key as string));
    const customOpts = extras
      .filter((e) => e.kind === "custom")
      .map((e) => ({ label: e.label, key: `custom:${e.label}` }))
      .filter((o) => !!o.label);
    return [
      ...PRESET_EXTRA_OPTIONS.map((o) => ({ label: o.label, key: String(o.key) })),
      ...customOpts.filter((o) => !seen.has(o.key)),
    ];
  }, [extras]);

  const toggleExtra = (key: string) => {
    const [kind, label] = key.split(":") as [PayStructure["extras"][number]["kind"], string];
    const idx = extras.findIndex(
      (x) => x.kind === kind && x.label.toLowerCase() === label.toLowerCase()
    );
    if (idx >= 0) {
      const next = extras.slice();
      next.splice(idx, 1);
      setExtras(next);
    } else {
      setExtras([...extras, { kind, label }]);
    }
  };

  const addCustomExtra = () => {
    const label = customLabel.trim();
    if (!label) return;
    const exists = extras.some(
      (x) => x.kind === "custom" && x.label.toLowerCase() === label.toLowerCase()
    );
    if (!exists) toggleExtra(`custom:${label}`);
    setCustomLabel("");
  };

  return (
    <PageSheet
      visible={visible}
      onClose={onClose}
      title={initial ? "Edit Employer" : "Add Employer"}
    >
      {/* Scroll content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FormText label="Name" value={name} onChange={setName} />

        <Text style={styles.label}>Color</Text>
        <ColorSwatches
          colors={PRESET_COLORS}
          value={color}
          onChange={(c) => {
            setColor(c);
            setCustomOpen(false);
          }}
          extra={
            <TouchableOpacity onPress={() => setCustomOpen((v) => !v)} style={styles.addSwatch}>
              <Text style={styles.addSwatchPlus}>+</Text>
            </TouchableOpacity>
          }
        />

        {customOpen && (
          <FormText
            label="Custom Hex"
            value={color}
            onChange={setColor}
            placeholder="#007AFF"
            autoCapitalize="none"
          />
        )}

        <Text style={[styles.label, styles.mt4]}>Base Pay</Text>
        <Segmented
          value={base}
          onChange={(v) => setBase(v as PayStructure["base"])}
          options={[
            { label: "Hourly", value: "hourly" },
            { label: "Salary", value: "salary" },
          ]}
        />

        {base === "hourly" && (
          <FormNumber
            label="Default Hourly Rate"
            value={defaultRate}
            onChange={setDefaultRate}
            placeholder="0.00"
          />
        )}

        <Text style={[styles.label, styles.mt10]}>Extras</Text>
        {/* If PillRow has a narrow union type for keys, `as any` widens to accept custom keys. */}
        <PillRow valueSet={valueSet} options={options as any} onToggle={(k: string) => toggleExtra(k)} />

        <Text style={[styles.label, styles.mt10]}>Custom extra</Text>
        <View style={styles.customRow}>
          <TextInput
            value={customLabel}
            onChangeText={setCustomLabel}
            placeholder='e.g. "SPIFF"'
            placeholderTextColor="#9CA3AF"
            style={styles.customInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={addCustomExtra} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer buttons fixed at bottom */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            onSave({
              name: name.trim() || "Employer",
              color,
              payStructure: { 
                base, 
                extras,
                ...(base === "hourly" && { defaultRate: Number(defaultRate) || 0 })
              },
            })
          }
          style={styles.saveBtn}
        >
          <Text style={styles.saveText}>{initial ? "Save" : "Save Employer"}</Text>
        </TouchableOpacity>
      </View>
    </PageSheet>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  label: { fontSize: 13, color: "#374151", fontWeight: "600" },
  mt4: { marginTop: 4 },
  mt10: { marginTop: 10 },

  addSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  addSwatchPlus: { color: COLORS.muted, fontWeight: "700" },

  customRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  customInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: COLORS.text,
    minHeight: 44,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "700" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  cancelText: { color: COLORS.text, fontWeight: "600" },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
