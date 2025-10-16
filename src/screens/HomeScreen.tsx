import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, Clock, Calculator, PlusCircle, ChevronRight } from "lucide-react-native";
import { getGreeting } from "scripts/time";
import { useUser } from "context/user";
import { useWageTracker } from "context/wageTracker";

// If you have a centralized COLORS theme, swap these to your tokens.
const COLORS = {
  bg: "#F7F8FA",
  text: "#0B1220",
  muted: "#6B7280",
  border: "#E5E7EB",
  card: "#FFFFFF",
  primary: "#007AFF",
  primaryMuted: "#E8F1FF",
  surface: "#F3F4F6",
  success: "#10B981",
};

const fmtCurrency = (n: number) =>
  Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const HomeScreen = ({ navigation }: any) => {
  const { user } = useUser();
  const { loading, employers, stats, nextSoonest } = useWageTracker();

  // Flatten last 8 paychecks across all employers for the spark bars
  const bars = useMemo(() => {
    const all = employers.flatMap(e =>
      e.history.map(h => ({ ...h, employerId: e.id, employerName: e.name }))
    );
    const lastN = all.sort((a, b) => a.date - b.date).slice(-8);
    const maxNet = lastN.reduce((m, p) => Math.max(m, p.net), 0) || 1;
    return lastN.map(p => ({
      label: new Date(p.date).toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
      heightPct: Math.max(0.18, Math.min(1, p.net / maxNet)), // slightly taller minimum
      value: p.net,
    }));
  }, [employers]);

  const hasAnyData = employers.length > 0 && (bars.length > 0 || !!nextSoonest);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero header */}
        <View style={styles.hero}>
          <View style={styles.flex1}>
            <Text style={styles.greeting}>
              Good {getGreeting()}, {user.firstName || "there"}
            </Text>
            <Text style={styles.subtle}>{today}</Text>
          </View>

          {/* Next pay pill */}
          <View style={[styles.pill, !nextSoonest && { backgroundColor: COLORS.surface }]}>
            <Clock size={14} color={nextSoonest ? COLORS.primary : COLORS.muted} />
            <Text style={[styles.pillText, !nextSoonest && { color: COLORS.muted }]}>
              {nextSoonest
                ? `Next pay · ${nextSoonest.date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}`
                : "No pay scheduled"}
            </Text>
          </View>
        </View>

        {/* Overview / Empty state */}
        <View style={styles.card}>
          {!loading && hasAnyData ? (
            <>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Pay Overview</Text>
              </View>

              {/* Spark bars */}
              <View style={styles.sparkRow}>
                {bars.length > 0 ? (
                  bars.map((b, i) => (
                    <View key={i} style={styles.sparkCol}>
                      <View style={[styles.sparkBar, { height: 96 * b.heightPct }]} />
                      <Text style={styles.sparkLabel}>{b.label}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sparkEmpty}>Add paychecks to see trends</Text>
                )}
              </View>

              {/* Quick stats */}
              <View style={styles.statsWrap}>
                <StatTile label="Last Net" value={fmtCurrency(stats.lastNet)} />
                <StatTile label="Avg Net (YTD)" value={fmtCurrency(stats.avgNet)} />
                <StatTile label="YTD Net" value={fmtCurrency(stats.ytdNet)} />
                <StatTile label="YTD Taxes" value={fmtCurrency(stats.ytdTax)} />
              </View>
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No pay data yet</Text>
              <Text style={styles.emptyText}>
                Set up an employer & schedule, or add your first paycheck to see insights here.
              </Text>

              <View style={styles.emptyActions}>
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                  onPress={() => navigation.navigate("Employers")}
                >
                  <PlusCircle size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Add Employer</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]}
                  onPress={() => navigation.navigate("PayTracker")}
                >
                  <Text style={styles.secondaryBtnText}>Log Paycheck</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Shortcut cards */}
        <View style={styles.grid3}>
          <Shortcut
            title="Wage Tracker"
            desc="Log new paycheck"
            Icon={Wallet}
            onPress={() => navigation.getParent()?.navigate("WageTrackerTabNavigator")}
          />
          <Shortcut
            title="Hour Tracking"
            desc="Validate hours vs pay"
            Icon={Clock}
            onPress={() => navigation.navigate("Hours")}
          />
          <Shortcut
            title="Budget Planner"
            desc="Plan & allocate"
            Icon={Calculator}
            onPress={() => navigation.navigate("Budget")}
          />
        </View>

        {/* Upcoming features */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Upcoming Features</Text>
          <Text style={styles.infoText}>
            Soon you’ll set payday reminders, track goals, and view richer insights here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ---------- small components ---------- */

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Shortcut({
  title,
  desc,
  Icon,
  onPress,
}: {
  title: string;
  desc: string;
  Icon: any;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.shortcut, pressed && styles.shortcutPressed]} onPress={onPress}>
      <View style={styles.badge}>
        <Icon size={18} color={COLORS.primary} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutDesc}>{desc}</Text>
      </View>
      <ChevronRight size={18} color={COLORS.muted} />
    </Pressable>
  );
}

/* ==================== styles ==================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 20, paddingBottom: 40 },

  /* utility */
  flex1: { flex: 1 },

  /* Hero */
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  greeting: { fontSize: 26, fontWeight: "800", color: COLORS.text },
  subtle: { fontSize: 14, color: COLORS.muted, marginTop: 2 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 12.5, color: COLORS.primary, fontWeight: "600" },

  /* Cards */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text },

  /* Spark bars */
  sparkRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 110,
    paddingVertical: 8,
    gap: 10,
    marginTop: 4,
  },
  sparkCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  sparkBar: {
    width: "68%",
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sparkLabel: { fontSize: 10, color: "#95A3B8", marginTop: 6 },
  sparkEmpty: { fontSize: 12, color: COLORS.muted },

  /* Stats */
  statsWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statTile: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexBasis: "48%",
    flexGrow: 1,
  },
  statLabel: { fontSize: 12, color: COLORS.muted },
  statValue: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginTop: 2 },

  /* Empty state */
  emptyWrap: { alignItems: "flex-start", gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  emptyText: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
  emptyActions: { flexDirection: "row", gap: 10, marginTop: 6 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800" },
  btnPressed: { opacity: 0.85 },

  secondaryBtn: {
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: "700" },
  secondaryPressed: { backgroundColor: "#FAFAFA" },

  /* Shortcuts */
  grid3: { marginTop: 2, gap: 12 },
  shortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  shortcutPressed: { opacity: 0.9 },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  shortcutDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

  /* Info card */
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.muted },
});
