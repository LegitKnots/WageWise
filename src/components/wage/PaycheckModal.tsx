import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PageSheet from "./PageSheet";
import { FormNumber, InlineDate, Divider, EmployerDropdown } from "./forms";
import { ButtonPrimary, ButtonSecondary } from "../ui";
import { useTheme } from "context/ThemeContext";
import type { Employer, PayDay, PayBreakdownItem } from "types/wageTracker";

export default function PaycheckModal({
  visible,
  onClose,
  employers,
  selectedEmployerId,
  onEmployerSelect,
  initial, // optional edit
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  employers: Employer[];
  selectedEmployerId: string | null;
  onEmployerSelect: (id: string) => void;
  initial?: PayDay;
  onSave: (entry: PayDay) => void;
}) {
  const { colors } = useTheme();
  const selectedEmployer = employers.find(emp => emp.id === selectedEmployerId);
  
  const [date, setDate] = React.useState<Date>(initial ? new Date(initial.date) : new Date());
  const [hours, setHours] = React.useState(String(getHourly(initial)?.hours ?? 0));
  const [rate, setRate] = React.useState(String(getHourly(initial)?.rate ?? selectedEmployer?.payStructure?.defaultRate ?? 0));
  const [baseAmt, setBaseAmt] = React.useState(String(getSalary(initial)?.amount ?? 0));
  const [taxes, setTaxes] = React.useState(String(initial?.taxes ?? 0));
  const [extras, setExtras] = React.useState<Record<string, string>>(
    initial
      ? toExtraMap(initial)
      : Object.fromEntries((selectedEmployer?.payStructure.extras || []).map((x) => [x.label, "0"]))
  );

  // Reset form when modal opens or employer changes
  React.useEffect(() => {
    if (!visible) return;
    
    const defaultRate = selectedEmployer?.payStructure?.defaultRate;
    const initialRate = getHourly(initial)?.rate;
    const finalRate = initialRate ?? defaultRate ?? 0;
    
    console.log('PaycheckModal reset:', {
      employerName: selectedEmployer?.name,
      defaultRate,
      initialRate,
      finalRate,
      isInitial: !!initial
    });
    
    setDate(initial ? new Date(initial.date) : new Date());
    setHours(String(getHourly(initial)?.hours ?? 0));
    setRate(String(finalRate));
    setBaseAmt(String(getSalary(initial)?.amount ?? 0));
    setTaxes(String(initial?.taxes ?? 0));
    setExtras(
      initial
        ? toExtraMap(initial)
        : Object.fromEntries((selectedEmployer?.payStructure.extras || []).map((x) => [x.label, "0"]))
    );
  }, [visible, initial, selectedEmployer?.payStructure?.defaultRate, selectedEmployer?.payStructure?.extras]);

  // Handle employer selection change
  const handleEmployerSelect = (id: string) => {
    onEmployerSelect(id);
    const newEmployer = employers.find(emp => emp.id === id);
    if (newEmployer) {
      // Reset form with new employer's defaults
      setRate(String(newEmployer.payStructure?.defaultRate ?? 0));
      setExtras(Object.fromEntries((newEmployer.payStructure.extras || []).map((x) => [x.label, "0"])));
    }
  };

  if (!selectedEmployer) return null;

  const gross = computeGross(selectedEmployer, { hours, rate, baseAmt, extras });
  const net = gross - Number(taxes || 0);

  const styles = StyleSheet.create({
    label: { fontSize: 13, color: colors.textMuted, fontWeight: "600", marginBottom: 12 },
    employerLabel: { fontSize: 14, color: colors.text, fontWeight: "700", marginBottom: 16 },
    mt16: { marginTop: 16 },

    row: { flexDirection: "row", gap: 10, marginBottom: 16 },
    col: { flex: 1 },

    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  });

  return (
    <PageSheet visible={visible} onClose={onClose} title="Paycheck">
      <Text style={styles.label}>Employer</Text>
      <EmployerDropdown
        employers={employers.map(emp => ({ 
          id: emp.id, 
          name: emp.name, 
          color: emp.color || '#007AFF' 
        }))}
        selectedId={selectedEmployerId}
        onSelect={handleEmployerSelect}
        placeholder="Select employer"
      />

      <Text style={styles.label}>Date</Text>
      <InlineDate value={date} onChange={(d) => setDate(d || new Date())} />

      <View style={styles.mt16}>
        {selectedEmployer.payStructure.base === "hourly" ? (
          <View style={styles.row}>
            <View style={styles.col}>
              <FormNumber label="Hours" value={hours} onChange={setHours} />
            </View>
            <View style={styles.col}>
              <FormNumber label="Rate" value={rate} onChange={setRate} />
            </View>
          </View>
        ) : (
          <FormNumber label="Base Amount" value={baseAmt} onChange={setBaseAmt} />
        )}
      </View>

      {(selectedEmployer.payStructure.extras || []).map((ex) => (
        <FormNumber
          key={ex.label}
          label={ex.label}
          value={extras[ex.label] ?? "0"}
          onChange={(v) => setExtras((prev) => ({ ...prev, [ex.label]: v }))}
        />
      ))}

      <Divider />

      <FormNumber label="Taxes" value={taxes} onChange={setTaxes} />
      <Row label="Gross" value={gross} bold colors={colors} />
      <Row label="Net" value={net} bold big colors={colors} />

      <View style={styles.actions}>
        <ButtonSecondary label="Cancel" onPress={onClose} />
        <ButtonPrimary
          label="Save"
          onPress={() => {
            const breakdown: PayBreakdownItem[] = [];
            if (selectedEmployer.payStructure.base === "hourly") {
              const h = Number(hours || 0);
              const r = Number(rate || 0);
              breakdown.push({ kind: "hourly", label: "Hourly", hours: h, rate: r, amount: h * r });
            } else {
              breakdown.push({ kind: "salary", label: "Salary", amount: Number(baseAmt || 0) });
            }
            for (const e of selectedEmployer.payStructure.extras) {
              breakdown.push({ kind: e.kind, label: e.label, amount: Number(extras[e.label] || 0) });
            }
            const entry: PayDay = {
              date: date.getTime(),
              breakdown,
              gross,
              taxes: Number(taxes || 0),
              net,
            };
            onSave(entry);
          }}
        />
      </View>
    </PageSheet>
  );
}

/* helpers */
function getHourly(p?: PayDay) {
  return p?.breakdown.find((b) => b.kind === "hourly") as
    | { hours: number; rate: number }
    | undefined;
}
function getSalary(p?: PayDay) {
  return p?.breakdown.find((b) => b.kind === "salary") as
    | { amount: number }
    | undefined;
}
function toExtraMap(p: PayDay) {
  const m: Record<string, string> = {};
  for (const b of p.breakdown) {
    if (b.kind !== "hourly" && b.kind !== "salary") m[b.label] = String(b.amount ?? 0);
  }
  return m;
}
function computeGross(
  selectedEmployer: Employer,
  state: { hours: string; rate: string; baseAmt: string; extras: Record<string, string> }
) {
  let g = 0;
  if (selectedEmployer.payStructure.base === "hourly") {
    g += Number(state.hours || 0) * Number(state.rate || 0);
  } else {
    g += Number(state.baseAmt || 0);
  }
  for (const k of Object.keys(state.extras)) g += Number(state.extras[k] || 0);
  return g;
}

function Row({ label, value, bold, big, colors }: { label: string; value: number; bold?: boolean; big?: boolean; colors: any }) {
  const styles = StyleSheet.create({
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      marginBottom: 8,
    },
    totalLabel: { color: colors.textMuted, fontWeight: "600" },
    totalValue: { color: colors.text, fontWeight: "700", fontSize: 14 },
    totalValueBold: { fontWeight: "800" },
    totalValueBig: { fontSize: 16 },
  });

  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, bold && styles.totalValueBold, big && styles.totalValueBig]}>
        {Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }).format(value || 0)}
      </Text>
    </View>
  );
}


