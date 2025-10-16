import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, Clock, Calculator, PlusCircle, ChevronRight, ClockPlus } from "lucide-react-native";
import { getGreeting } from "scripts/time";
import { useUser } from "context/user";
import { useWageTracker } from "context/wageTracker";
import { useTheme } from "context/ThemeContext";

const fmtCurrency = (n: number) =>
  Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const HomeScreen = ({ navigation }: any) => {
  const { user } = useUser();
  const { loading, employers, stats, nextSoonest } = useWageTracker();
  const { colors } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero header */}
        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Good {getGreeting()}, {user.firstName || "there"}
          </Text>
          <Text style={[styles.subtle, { color: colors.textMuted }]}>{today}</Text>
        </View>

        {/* Overview / Empty state */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {!loading && hasAnyData ? (
            <>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Pay Overview</Text>
                {nextSoonest && (
                  <View style={[
                    styles.pill, 
                    { 
                      backgroundColor: colors.primaryMuted
                    }
                  ]}>
                    <ClockPlus size={14} color={colors.primary} />
                    <Text style={[
                      styles.pillText, 
                      { 
                        color: colors.primary
                      }
                    ]}>
                      {nextSoonest.date.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </View>

              {/* Spark bars */}
              {bars.length > 0 ? (
                <View style={styles.sparkRow}>
                  {bars.map((b, i) => (
                    <View key={i} style={styles.sparkCol}>
                      <View style={[styles.sparkBar, { height: 96 * b.heightPct, backgroundColor: colors.primary }]} />
                      <Text style={[styles.sparkLabel, { color: colors.textMuted }]}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.sparkEmptyContainer}>
                  <Text style={[styles.sparkEmpty, { color: colors.textMuted }]}>Add paychecks to see trends</Text>
                </View>
              )}

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
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No pay data yet</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Set up an employer & schedule, or add your first paycheck to see insights here.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn, 
                  { backgroundColor: colors.primary },
                  pressed && styles.btnPressed
                ]}
                onPress={() => navigation.getParent()?.navigate("WageTrackerTabNavigator", {
                  screen: "mainScreen",
                  params: { openAddEmployer: true }
                })}
              >
                <PlusCircle size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Add Employer</Text>
              </Pressable>
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
            onPress={() => navigation.navigate("HourTracking")}
          />
          <Shortcut
            title="Budget Planner"
            desc="Plan & allocate"
            Icon={Calculator}
            onPress={() => navigation.navigate("BudgetPlanner")}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ---------- small components ---------- */

function StatTile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
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
  const { colors } = useTheme();
  return (
    <Pressable style={({ pressed }) => [
      styles.shortcut, 
      { 
        backgroundColor: colors.card,
        borderColor: colors.border 
      },
      pressed && styles.shortcutPressed
    ]} onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: colors.surface }]}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={styles.flex1}>
        <Text style={[styles.shortcutTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.shortcutDesc, { color: colors.textMuted }]}>{desc}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

/* ==================== styles ==================== */
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  /* utility */
  flex1: { flex: 1 },

  /* Hero */
  hero: {
    marginBottom: 12,
  },
  greeting: { 
    fontSize: 26, 
    fontWeight: "800",
  },
  subtle: { fontSize: 14, marginTop: 2 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 12.5, fontWeight: "600" },

  /* Cards */
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "700" },

  /* Spark bars */
  sparkRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 8,
    gap: 10,
    marginTop: 4,
  },
  sparkCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  sparkBar: {
    width: "68%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  sparkLabel: { fontSize: 10, marginTop: 6 },
  sparkEmptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  sparkEmpty: { 
    fontSize: 16, 
    fontWeight: "600",
    textAlign: "center",
  },

  /* Stats */
  statsWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statTile: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexBasis: "48%",
    flexGrow: 1,
  },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 2 },

  /* Empty state */
  emptyWrap: { alignItems: "flex-start", gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  emptyText: { fontSize: 13, lineHeight: 18 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800" },
  btnPressed: { opacity: 0.85 },

  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  secondaryBtnText: { fontWeight: "700" },
  secondaryPressed: { opacity: 0.9 },

  /* Shortcuts */
  grid3: { marginTop: 2, gap: 12 },
  shortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
  },
  shortcutPressed: { opacity: 0.9 },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTitle: { fontSize: 15, fontWeight: "700" },
  shortcutDesc: { fontSize: 12, marginTop: 2 },

});
