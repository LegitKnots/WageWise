import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PlusCircle,
  Wallet,
  Pencil,
  Trash2,
  Settings,
  CalendarClock,
} from "lucide-react-native";
import { useWageTracker } from "context/wageTracker";
import type { Employer, PayDay, Schedule } from "types/wageTracker";

/* ---------- utils ---------- */
const fmtCurrency = (n: number) =>
  Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

function lastOf<T>(arr: T[]): T | undefined {
  return arr.length ? arr[arr.length - 1] : undefined;
}

function toDateInputValue(ms?: number) {
  const d = ms ? new Date(ms) : new Date();
  // yyyy-mm-dd
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseDateInputValue(v: string): number {
  // naive parse yyyy-mm-dd; falls back to now
  const [y, m, d] = v.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return Date.now();
  const dt = new Date(y, m - 1, d, 9, 0, 0, 0);
  return dt.getTime();
}

const DOW_LABELS: NonNullable<Schedule["dayOfWeek"]>[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/* ---------- main screen ---------- */
const WageTrackerScreen = ({ navigation }: any) => {
  const {
    loading,
    employers,
    addEmployer,
    updateEmployer,
    deleteEmployer,
    addPayday,
    upsertPayday,
    deletePaydayByDate,
    nextPayDates,
  } = useWageTracker();

  // Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Editing state
  const [activeEmployerId, setActiveEmployerId] = useState<string | null>(null);
  const activeEmployer = useMemo(
    () => employers.find((e) => e.id === activeEmployerId) || null,
    [employers, activeEmployerId]
  );

  // Pay form state
  const [payDate, setPayDate] = useState<string>(toDateInputValue());
  const [gross, setGross] = useState<string>("");
  const [taxes, setTaxes] = useState<string>("");
  const [net, setNet] = useState<string>("");

  // Employer form state
  const [empName, setEmpName] = useState<string>("");
  const [empColor, setEmpColor] = useState<string>("#007AFF");
  const [editingEmployer, setEditingEmployer] = useState<boolean>(false);

  // Schedule form state
  const [freq, setFreq] = useState<Schedule["payFrequency"]>("biweekly");
  const [dayOfWeek, setDayOfWeek] =
    useState<NonNullable<Schedule["dayOfWeek"]>>("friday");
  const [dayOfMonth, setDayOfMonth] = useState<string>("1");
  const [anchor, setAnchor] = useState<string>(""); // yyyy-mm-dd
  const [hour, setHour] = useState<string>("9");
  const [minute, setMinute] = useState<string>("0");

  /* ---------- helpers ---------- */
  const resetPayForm = useCallback(() => {
    setPayDate(toDateInputValue());
    setGross("");
    setTaxes("");
    setNet("");
  }, []);

  const openPayModal = useCallback(
    (employerId?: string) => {
      const id = employerId ?? employers[0]?.id ?? null;
      if (!id) {
        Alert.alert(
          "No employer",
          "Add an employer & schedule before logging a paycheck."
        );
        return;
      }
      setActiveEmployerId(id);
      resetPayForm();
      setShowPayModal(true);
    },
    [employers, resetPayForm]
  );

  const openEmployerModal = useCallback(
    (e?: Employer) => {
      if (e) {
        // edit
        setEditingEmployer(true);
        setActiveEmployerId(e.id);
        setEmpName(e.name);
        setEmpColor(e.color ?? "#007AFF");
      } else {
        // add
        setEditingEmployer(false);
        setActiveEmployerId(null);
        setEmpName("");
        setEmpColor("#007AFF");
      }
      setShowEmployerModal(true);
    },
    []
  );

  const openScheduleModal = useCallback(
    (e: Employer) => {
      setActiveEmployerId(e.id);
      setFreq(e.schedule.payFrequency);
      setDayOfWeek(e.schedule.dayOfWeek ?? "friday");
      setDayOfMonth(String(e.schedule.dayOfMonth ?? 1));
      setAnchor(e.schedule.biweeklyAnchorDate ? toDateInputValue(e.schedule.biweeklyAnchorDate) : "");
      setHour(String(e.schedule.hour ?? 9));
      setMinute(String(e.schedule.minute ?? 0));
      setShowScheduleModal(true);
    },
    []
  );

  /* ---------- submit handlers ---------- */
  const submitPay = useCallback(async () => {
    if (!activeEmployerId) return;
    const entry: PayDay = {
      date: parseDateInputValue(payDate),
      gross: Number(gross || 0),
      taxes: Number(taxes || 0),
      net: Number(net || 0) || Number(gross || 0) - Number(taxes || 0),
    };
    await addPayday(activeEmployerId, entry);
    setShowPayModal(false);
  }, [activeEmployerId, payDate, gross, taxes, net, addPayday]);

  const submitEmployer = useCallback(async () => {
    if (editingEmployer) {
      if (!activeEmployerId) return;
      await updateEmployer(activeEmployerId, {
        name: empName.trim() || "Employer",
        color: empColor,
      });
    } else {
      // require you to generate an id; here we use timestamp for simplicity
      const id = `emp_${Date.now()}`;
      await addEmployer({
        id,
        name: empName.trim() || "Employer",
        color: empColor,
        schedule: {
          payFrequency: "biweekly",
          dayOfWeek: "friday",
          hour: 9,
          minute: 0,
        },
      });
      setActiveEmployerId(id);
    }
    setShowEmployerModal(false);
  }, [
    editingEmployer,
    activeEmployerId,
    empName,
    empColor,
    addEmployer,
    updateEmployer,
  ]);

  const submitSchedule = useCallback(async () => {
    if (!activeEmployerId) return;

    const patch: Partial<Employer> = {
      schedule: {
        payFrequency: freq,
        dayOfWeek: freq !== "monthly" ? dayOfWeek : undefined,
        dayOfMonth: freq === "monthly" ? Number(dayOfMonth || 1) : undefined,
        biweeklyAnchorDate:
          freq === "biweekly" && anchor ? parseDateInputValue(anchor) : undefined,
        hour: Number(hour || 9),
        minute: Number(minute || 0),
      } as Schedule,
    };

    await updateEmployer(activeEmployerId, patch);
    setShowScheduleModal(false);
  }, [activeEmployerId, freq, dayOfWeek, dayOfMonth, anchor, hour, minute, updateEmployer]);

  /* ---------- derived ---------- */
  const soonest = nextPayDates[0];
  const hasData = employers.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header + primary action */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Wage Tracker</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => openPayModal()}
          >
            <PlusCircle size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Log Paycheck</Text>
          </TouchableOpacity>
        </View>

        {/* Empty guidance */}
        {!loading && !hasData && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Set up your first employer</Text>
            <Text style={styles.emptyText}>
              Add an employer and schedule, then start logging paychecks.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => openEmployerModal()}
              >
                <PlusCircle size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Add Employer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Soonest pay + actions */}
        {hasData && soonest && (
          <View style={styles.banner}>
            <CalendarClock size={18} color="#111827" />
            <Text style={styles.bannerText}>
              Next pay:{" "}
              <Text style={styles.bannerStrong}>
                {soonest.date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </Text>
          </View>
        )}

        {/* Employer list */}
        {employers.map((e) => {
          const last = lastOf(e.history);
          const lastNet = last?.net ?? 0;
          const upcoming = nextPayDates.find((n) => n.employerId === e.id)?.date;

          return (
            <View key={e.id} style={styles.empCard}>
              <View style={styles.empHeader}>
                <View style={styles.empLeft}>
                  <View
                    style={[styles.colorDot, { backgroundColor: e.color || "#3B82F6" }]}
                  />
                  <Text style={styles.empName}>{e.name}</Text>
                </View>

                <View style={styles.empActions}>
                  <TouchableOpacity onPress={() => openScheduleModal(e)} style={styles.iconBtn}>
                    <Settings size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEmployerModal(e)} style={styles.iconBtn}>
                    <Pencil size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Remove employer?",
                        "This will delete all pay history for this employer.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteEmployer(e.id),
                          },
                        ]
                      )
                    }
                    style={styles.iconBtn}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Employer stats row */}
              <View style={styles.empStatsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Last Net</Text>
                  <Text style={styles.statValue}>{fmtCurrency(lastNet)}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Entries</Text>
                  <Text style={styles.statValue}>{e.history.length}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Next Pay</Text>
                  <Text style={styles.statValue}>
                    {upcoming
                      ? upcoming.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </Text>
                </View>
              </View>

              {/* Pay history list (compact) */}
              {e.history.length > 0 ? (
                <View style={{ marginTop: 10, gap: 8 }}>
                  {e.history
                    .slice(-5)
                    .reverse()
                    .map((p) => (
                      <View key={p.date} style={styles.payRow}>
                        <Wallet size={18} color="#007AFF" />
                        <Text style={styles.payRowText}>
                          {new Date(p.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}{" "}
                          • {fmtCurrency(p.net)}
                        </Text>
                        <View style={{ flex: 1 }} />
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => {
                            // open pay modal prefilled for edit
                            setActiveEmployerId(e.id);
                            setPayDate(toDateInputValue(p.date));
                            setGross(String(p.gross));
                            setTaxes(String(p.taxes));
                            setNet(String(p.net));
                            setShowPayModal(true);
                          }}
                        >
                          <Pencil size={18} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() =>
                            Alert.alert("Delete paycheck?", "", [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => deletePaydayByDate(e.id, p.date),
                              },
                            ])
                          }
                        >
                          <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              ) : (
                <Text style={styles.empEmptyText}>No pay entries yet.</Text>
              )}

              {/* Employer-level quick action */}
              <View style={{ marginTop: 10 }}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => openPayModal(e.id)}
                >
                  <Text style={styles.secondaryBtnText}>Log Paycheck for {e.name}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Manage section (less prominent) */}
        {hasData && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { alignSelf: "flex-start" }]}
              onPress={() => openEmployerModal()}
            >
              <Text style={styles.secondaryBtnText}>Add Another Employer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ---------- MODALS ---------- */}
      {/* Paycheck Add/Edit */}
      <PageSheet visible={showPayModal} onClose={() => setShowPayModal(false)} title="Paycheck">
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Employer</Text>
          <Text style={styles.formHint}>
            {activeEmployer?.name ?? employers.find((x) => x.id === activeEmployerId)?.name ?? "—"}
          </Text>
        </View>

        <FormDate label="Date" value={payDate} onChange={setPayDate} />

        <FormNumber label="Gross" value={gross} onChange={setGross} />
        <FormNumber label="Taxes" value={taxes} onChange={setTaxes} />
        <FormNumber label="Net" value={net} onChange={setNet} placeholder="(auto = gross - taxes)" />

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowPayModal(false)}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={submitPay}>
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </PageSheet>

      {/* Employer Add/Edit */}
      <PageSheet
        visible={showEmployerModal}
        onClose={() => setShowEmployerModal(false)}
        title={editingEmployer ? "Edit Employer" : "Add Employer"}
      >
        <FormText label="Name" value={empName} onChange={setEmpName} />
        <FormText label="Color (hex)" value={empColor} onChange={setEmpColor} />

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowEmployerModal(false)}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={submitEmployer}>
            <Text style={styles.primaryBtnText}>{editingEmployer ? "Save" : "Add"}</Text>
          </TouchableOpacity>
        </View>
      </PageSheet>

      {/* Schedule Edit */}
      <PageSheet
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Edit Schedule"
      >
        {/* Frequency */}
        <FormSelect
          label="Pay Frequency"
          value={freq}
          options={[
            { label: "Weekly", value: "weekly" },
            { label: "Biweekly", value: "biweekly" },
            { label: "Monthly", value: "monthly" },
          ]}
          onChange={(v) => setFreq(v as Schedule["payFrequency"])}
        />

        {/* Day fields conditional */}
        {freq === "monthly" ? (
          <FormNumber label="Day of Month (1-31)" value={dayOfMonth} onChange={setDayOfMonth} />
        ) : (
          <FormSelect
            label="Day of Week"
            value={dayOfWeek}
            options={DOW_LABELS.map((d) => ({ label: capitalize(d), value: d }))}
            onChange={(v) => setDayOfWeek(v as NonNullable<Schedule["dayOfWeek"]>)}
          />
        )}

        {freq === "biweekly" && (
          <FormDate
            label="Biweekly Anchor (first known payday)"
            value={anchor}
            onChange={setAnchor}
          />
        )}

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <FormNumber label="Hour (0-23)" value={hour} onChange={setHour} />
          </View>
          <View style={{ flex: 1 }}>
            <FormNumber label="Minute (0-59)" value={minute} onChange={setMinute} />
          </View>
        </View>

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowScheduleModal(false)}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={submitSchedule}>
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </PageSheet>
    </SafeAreaView>
  );
};

export default WageTrackerScreen;

/* ---------- Small UI helpers (page sheet + form inputs) ---------- */
function PageSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === "ios" ? "slide" : "fade"}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      transparent={false}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14, borderBottomColor: "#E5E7EB", borderBottomWidth: 1, backgroundColor: "#FFFFFF" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>{title}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FormText({
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
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

function FormNumber(props: React.ComponentProps<typeof FormText>) {
  return <FormText {...props} placeholder={props.placeholder} />;
}

function FormDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Using simple yyyy-mm-dd text input for portability
  return (
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
      />
    </View>
  );
}

function FormSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  // Minimal select: horizontal pills; swap for a proper picker later
  return (
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              style={[
                styles.pill,
                { backgroundColor: active ? "#111827" : "#E5E7EB" },
              ]}
            >
              <Text style={{ color: active ? "#FFFFFF" : "#111827", fontWeight: "600" }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#111827", flex: 1 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700" },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  emptyText: { fontSize: 13, color: "#6B7280", marginTop: 4 },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E5F0FF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderColor: "#C7DBFF",
    borderWidth: 1,
  },
  bannerText: { color: "#111827", fontSize: 14, fontWeight: "500" },
  bannerStrong: { fontWeight: "800" },

  empCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  empHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  empLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  colorDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#3B82F6" },
  empName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  empActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 6, borderRadius: 8 },

  empStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
  },
  statChip: {
    flexGrow: 1,
    flexBasis: "30%",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: { fontSize: 11, color: "#6B7280" },
  statValue: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 2 },

  payRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
  },
  payRowText: { marginLeft: 8, color: "#111827", fontWeight: "600" },
  empEmptyText: { color: "#6B7280", marginTop: 6 },

  /* form */
  formRow: { gap: 6, marginBottom: 10 },
  formLabel: { fontSize: 13, color: "#374151", fontWeight: "600" },
  formHint: { fontSize: 14, color: "#111827", fontWeight: "700" },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#111827",
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  sheetActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  secondaryBtn: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: { color: "#111827", fontWeight: "600" },
});

