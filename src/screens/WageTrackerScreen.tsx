import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PlusCircle,
  Wallet,
  Pencil,
  Trash2,
  CalendarClock,
  CalendarCog,
} from "lucide-react-native";

import EmployerEditorModal, {
  EmployerEditorPayload,
} from "components/wage/EmployerEditorModal";
import ScheduleModal from "components/wage/ScheduleModal";
import PaycheckModal from "components/wage/PaycheckModal";
import { COLORS } from "components/wage/theme";

import { useWageTracker } from "context/wageTracker";
import type { Employer, PayDay } from "types/wageTracker";

/* -------------------- utils -------------------- */
const fmtCurrency = (n: number) =>
  Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

const lastOf = <T,>(arr: T[]): T | undefined => (arr.length ? arr[arr.length - 1] : undefined);

/* =========================================================
   Screen
========================================================= */
const WageTrackerScreen = () => {
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

  /* ---------- modal / editing state ---------- */
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const [editingEmployer, setEditingEmployer] = useState(false);
  const [activeEmployerId, setActiveEmployerId] = useState<string | null>(null);
  const [editPayInitial, setEditPayInitial] = useState<PayDay | undefined>(undefined);

  const activeEmployer = useMemo<Employer | null>(
    () => employers.find((e) => e.id === activeEmployerId) || null,
    [employers, activeEmployerId]
  );

  const soonest = nextPayDates[0];
  const hasData = employers.length > 0;

  /* ---------- open handlers ---------- */
  const openEmployerModal = useCallback((e?: Employer) => {
    if (e) {
      setEditingEmployer(true);
      setActiveEmployerId(e.id);
    } else {
      setEditingEmployer(false);
      setActiveEmployerId(null);
    }
    setShowEmployerModal(true);
  }, []);

  const openScheduleModal = useCallback((e: Employer) => {
    setActiveEmployerId(e.id);
    setShowScheduleModal(true);
  }, []);

  const openPayModal = useCallback(
    (employerId?: string, initial?: PayDay) => {
      const id = employerId ?? employers[0]?.id ?? null;
      if (!id) {
        Alert.alert("No employer", "Add an employer & schedule before logging a paycheck.");
        return;
      }
      setActiveEmployerId(id);
      setEditPayInitial(initial);
      setShowPayModal(true);
    },
    [employers]
  );

  /* ---------- save handlers ---------- */
  const handleSaveEmployer = useCallback(
    async (payload: EmployerEditorPayload) => {
      if (editingEmployer && activeEmployerId) {
        // EDIT flow
        await updateEmployer(activeEmployerId, {
          name: payload.name,
          color: payload.color,
          payStructure: payload.payStructure,
        });
        setShowEmployerModal(false);
        return;
      }

      // ADD flow
      const id = `emp_${Date.now()}`;
      await addEmployer({
        id,
        name: payload.name,
        color: payload.color,
        schedule: {
          payFrequency: "biweekly",
          dayOfWeek: "friday",
          hour: 9,
          minute: 0,
        },
        payStructure: payload.payStructure,
        history: [],
      });

      setActiveEmployerId(id);
      setShowEmployerModal(false);

      // Wait for the close animation, then open schedule editor for the new employer
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => setShowScheduleModal(true), 150);
      });
    },
    [editingEmployer, activeEmployerId, updateEmployer, addEmployer]
  );

  const handleSaveSchedule = useCallback(
    async (schedule: Employer["schedule"]) => {
      if (!activeEmployerId) return;
      await updateEmployer(activeEmployerId, { schedule });
      setShowScheduleModal(false);
    },
    [activeEmployerId, updateEmployer]
  );

  const handleSavePay = useCallback(
    async (entry: PayDay) => {
      if (!activeEmployerId) return;

      if (editPayInitial) {
        if (upsertPayday) {
          await upsertPayday(activeEmployerId, entry);
        } else {
          await deletePaydayByDate(activeEmployerId, editPayInitial.date);
          await addPayday(activeEmployerId, entry);
        }
      } else {
        await addPayday(activeEmployerId, entry);
      }

      setEditPayInitial(undefined);
      setShowPayModal(false);
    },
    [activeEmployerId, editPayInitial, upsertPayday, deletePaydayByDate, addPayday]
  );

  /* -------------------- render -------------------- */
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Wage Tracker</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => openPayModal()}>
            <PlusCircle size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Log Paycheck</Text>
          </TouchableOpacity>
        </View>

        {/* Empty guidance */}
        {!loading && !hasData && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Set up your first employer</Text>
            <Text style={styles.emptyText}>
              Add an employer, choose color & pay type, then start logging paychecks.
            </Text>
            <TouchableOpacity style={[styles.primaryBtn, styles.mt8]} onPress={() => openEmployerModal()}>
              <PlusCircle size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Add Employer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Soonest pay banner */}
        {hasData && soonest && (
          <View style={styles.banner}>
            <CalendarClock size={18} color={COLORS.text} />
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
          const upcoming = nextPayDates.find((n) => n.employerId === e.id)?.date;

          return (
            <View key={e.id} style={styles.empCard}>
              <View style={styles.empHeader}>
                <View style={styles.empLeft}>
                  <View style={[styles.colorDot, { backgroundColor: e.color || COLORS.primary }]} />
                  <Text style={styles.empName}>{e.name}</Text>
                </View>

                <View style={styles.empActions}>
                  <TouchableOpacity onPress={() => openScheduleModal(e)} style={styles.iconBtn}>
                    <CalendarCog size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEmployerModal(e)} style={styles.iconBtn}>
                    <Pencil size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Remove employer?", "This will delete all pay history for this employer.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => deleteEmployer(e.id) },
                      ])
                    }
                    style={styles.iconBtn}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.empStatsRow}>
                <Stat label="Last Net" value={fmtCurrency(last?.net ?? 0)} />
                <Stat label="Entries" value={String(e.history.length)} />
                <Stat
                  label="Next Pay"
                  value={
                    upcoming
                      ? upcoming.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      : "—"
                  }
                />
              </View>

              {/* History (compact) */}
              {e.history.length > 0 ? (
                <View style={styles.historyWrap}>
                  {e.history
                    .slice(-5)
                    .reverse()
                    .map((p) => (
                      <View key={p.date} style={styles.payRow}>
                        <Wallet size={18} color={e.color || COLORS.primary} />
                        <Text style={styles.payRowText}>
                          {new Date(p.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          })}{" "}
                          • {fmtCurrency(p.net)}
                        </Text>
                        <View style={styles.flex1} />
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => {
                            setActiveEmployerId(e.id);
                            setEditPayInitial(p);
                            setShowPayModal(true);
                          }}
                        >
                          <Pencil size={18} color={COLORS.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() =>
                            Alert.alert("Delete paycheck?", "", [
                              { text: "Cancel", style: "cancel" },
                              { text: "Delete", style: "destructive", onPress: () => deletePaydayByDate(e.id, p.date) },
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

              {/* Employer-level action */}
              <TouchableOpacity style={[styles.secondaryBtn, styles.mt10]} onPress={() => openPayModal(e.id)}>
                <Text style={styles.secondaryBtnText}>Log Paycheck for {e.name}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Manage */}
        {hasData && (
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.manageBtn]}
            onPress={() => openEmployerModal()}
          >
            <Text style={styles.secondaryBtnText}>Add Another Employer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ============== MODALS ============== */}

      {/* Employer add/edit */}
      <EmployerEditorModal
        visible={showEmployerModal}
        onClose={() => setShowEmployerModal(false)}
        initial={
          editingEmployer && activeEmployer
            ? { name: activeEmployer.name, color: activeEmployer.color ?? "#007AFF", payStructure: activeEmployer.payStructure }
            : undefined
        }
        onSave={handleSaveEmployer}
      />

      {/* Schedule */}
      {activeEmployer && (
        <ScheduleModal
          visible={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          initial={activeEmployer.schedule}
          onSave={handleSaveSchedule}
        />
      )}

      {/* Paycheck add/edit */}
      <PaycheckModal
        visible={showPayModal}
        onClose={() => {
          setEditPayInitial(undefined);
          setShowPayModal(false);
        }}
        employer={activeEmployer}
        initial={editPayInitial}
        onSave={handleSavePay}
      />
    </SafeAreaView>
  );
};

export default WageTrackerScreen;

/* =========================================================
   Small subcomponents & styles
========================================================= */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingBottom: 40 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text, flex: 1 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700" },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderColor: COLORS.border,
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptyText: { fontSize: 13, color: COLORS.muted, marginTop: 4 },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primaryMuted,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderColor: "#C7DBFF",
    borderWidth: 1,
  },
  bannerText: { color: COLORS.text, fontSize: 14, fontWeight: "500" },
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
  empHeader: { flexDirection: "row", alignItems: "center" },
  empLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  empName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  empActions: { flexDirection: "row", gap: 8 },
  iconBtn: { padding: 6, borderRadius: 8 },

  empStatsRow: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  statChip: {
    flexGrow: 1,
    flexBasis: "30%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: { fontSize: 11, color: COLORS.muted },
  statValue: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginTop: 2 },

  payRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
  },
  payRowText: { marginLeft: 8, color: COLORS.text, fontWeight: "600" },
  empEmptyText: { color: COLORS.muted, marginTop: 6 },

  secondaryBtn: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: "600" },

  /* --- extracted from former inline styles --- */
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
  historyWrap: { marginTop: 10, gap: 8 },
  flex1: { flex: 1 },
  manageBtn: { alignSelf: "flex-start", marginTop: 8 },
});
