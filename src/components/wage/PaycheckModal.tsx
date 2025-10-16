import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PageSheet from "./PageSheet";
import { FormNumber, InlineDate, Divider } from "./forms";
import { COLORS } from "./theme";
import type { Employer, PayDay, PayBreakdownItem } from "types/wageTracker";

export default function PaycheckModal({
  visible,
  onClose,
  employer,
  initial, // optional edit
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  employer: Employer | null;
  initial?: PayDay;
  onSave: (entry: PayDay) => void;
}) {
  const [date, setDate] = React.useState<Date>(initial ? new Date(initial.date) : new Date());
  const [hours, setHours] = React.useState(String(getHourly(initial)?.hours ?? 0));
  const [rate, setRate] = React.useState(String(getHourly(initial)?.rate ?? employer?.payStructure?.defaultRate ?? 0));
  const [baseAmt, setBaseAmt] = React.useState(String(getSalary(initial)?.amount ?? 0));
  const [taxes, setTaxes] = React.useState(String(initial?.taxes ?? 0));
  const [extras, setExtras] = React.useState<Record<string, string>>(
    initial
      ? toExtraMap(initial)
      : Object.fromEntries((employer?.payStructure.extras || []).map((x) => [x.label, "0"]))
  );

  // Reset form when modal opens or employer changes
  React.useEffect(() => {
    if (!visible) return;
    
    const defaultRate = employer?.payStructure?.defaultRate;
    const initialRate = getHourly(initial)?.rate;
    const finalRate = initialRate ?? defaultRate ?? 0;
    
    console.log('PaycheckModal reset:', {
      employerName: employer?.name,
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
        : Object.fromEntries((employer?.payStructure.extras || []).map((x) => [x.label, "0"]))
    );
  }, [visible, initial, employer?.payStructure?.defaultRate, employer?.payStructure?.extras]);

  if (!employer) return null;

  const gross = computeGross(employer, { hours, rate, baseAmt, extras });
  const net = gross - Number(taxes || 0);

  return (
    <PageSheet visible={visible} onClose={onClose} title="Paycheck">
      <Text style={styles.label}>Employer</Text>
      <Text style={styles.employerName}>{employer?.name ?? "—"}</Text>

      <Text style={styles.label}>Date</Text>
      <InlineDate value={date} onChange={(d) => setDate(d || new Date())} />

      {employer.payStructure.base === "hourly" ? (
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

      {(employer.payStructure.extras || []).map((ex) => (
        <FormNumber
          key={ex.label}
          label={ex.label}
          value={extras[ex.label] ?? "0"}
          onChange={(v) => setExtras((prev) => ({ ...prev, [ex.label]: v }))}
        />
      ))}

      <Divider />

      <Row label="Gross" value={gross} bold />
      <FormNumber label="Taxes" value={taxes} onChange={setTaxes} />
      <Row label="Net" value={net} bold big />

      <View style={styles.actions}>
        <ButtonSecondary label="Cancel" onPress={onClose} />
        <ButtonPrimary
          label="Save"
          onPress={() => {
            const breakdown: PayBreakdownItem[] = [];
            if (employer.payStructure.base === "hourly") {
              const h = Number(hours || 0);
              const r = Number(rate || 0);
              breakdown.push({ kind: "hourly", label: "Hourly", hours: h, rate: r, amount: h * r });
            } else {
              breakdown.push({ kind: "salary", label: "Salary", amount: Number(baseAmt || 0) });
            }
            for (const e of employer.payStructure.extras) {
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
  employer: Employer,
  state: { hours: string; rate: string; baseAmt: string; extras: Record<string, string> }
) {
  let g = 0;
  if (employer.payStructure.base === "hourly") {
    g += Number(state.hours || 0) * Number(state.rate || 0);
  } else {
    g += Number(state.baseAmt || 0);
  }
  for (const k of Object.keys(state.extras)) g += Number(state.extras[k] || 0);
  return g;
}

function Row({ label, value, bold, big }: { label: string; value: number; bold?: boolean; big?: boolean }) {
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

function ButtonSecondary({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Text onPress={onPress} style={styles.btnSecondaryWrapper}>
      <Text style={styles.btnSecondaryText}>{label}</Text>
    </Text>
  );
}
function ButtonPrimary({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Text onPress={onPress} style={styles.btnPrimaryWrapper}>
      <Text style={styles.btnPrimaryText}>{label}</Text>
    </Text>
  );
}

/* styles */
const styles = StyleSheet.create({
  label: { fontSize: 13, color: "#374151", fontWeight: "600" },
  employerName: { fontSize: 14, color: COLORS.text, fontWeight: "700" },

  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },

  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  totalLabel: { color: COLORS.muted, fontWeight: "600" },
  totalValue: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  totalValueBold: { fontWeight: "800" },
  totalValueBig: { fontSize: 18 },

  btnSecondaryWrapper: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  btnSecondaryText: { color: COLORS.text, fontWeight: "600" },

  btnPrimaryWrapper: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});
