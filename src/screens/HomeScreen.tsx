import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, Clock, Calculator, PlusCircle } from "lucide-react-native";
import { getGreeting } from "scripts/time";
import { useUser } from "context/user";
import { useWageTracker } from "context/wageTracker";

// currency helper
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
      heightPct: Math.max(0.12, Math.min(1, p.net / maxNet)),
      value: p.net,
    }));
  }, [employers]);

  const hasAnyData = employers.length > 0 && (bars.length > 0 || !!nextSoonest);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.headerTitle}>Good {getGreeting()}, {user.firstName || "there"}</Text>
        <Text style={styles.subHeader}>Here’s your overview for today</Text>

        {/* ===== Top: Overview / Empty state ===== */}
        <View style={styles.overviewCard}>
          {!loading && hasAnyData ? (
            <>
              <View style={styles.overviewHeaderRow}>
                <Text style={styles.overviewTitle}>Pay Overview</Text>
                {nextSoonest ? (
                  <Text style={styles.overviewNextPay}>
                    Next Pay:{" "}
                    <Text style={styles.overviewNextPayStrong}>
                      {nextSoonest.date.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </Text>
                ) : (
                  <Text style={styles.overviewNextPay}>No upcoming pay scheduled</Text>
                )}
              </View>

              {/* Spark Bars */}
              <View style={styles.sparkRow}>
                {bars.length > 0 ? (
                  bars.map((b, i) => (
                    <View key={i} style={styles.sparkBarWrap}>
                      <View style={[styles.sparkBar, { height: 90 * b.heightPct }]} />
                      <Text style={styles.sparkLabel}>{b.label}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.sparkEmpty}>Add paychecks to see trends</Text>
                )}
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStatsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Last Net</Text>
                  <Text style={styles.statValue}>{fmtCurrency(stats.lastNet)}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Avg Net (YTD)</Text>
                  <Text style={styles.statValue}>{fmtCurrency(stats.avgNet)}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>YTD Net</Text>
                  <Text style={styles.statValue}>{fmtCurrency(stats.ytdNet)}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>YTD Taxes</Text>
                  <Text style={styles.statValue}>{fmtCurrency(stats.ytdTax)}</Text>
                </View>
              </View>
            </>
          ) : (
            // Empty state (no data in storage yet)
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No pay data yet</Text>
              <Text style={styles.emptyText}>
                Set up an employer & schedule, or add your first paycheck to see insights here.
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Employers")}>
                  <PlusCircle size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Add Employer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("PayTracker")}>
                  <Text style={styles.secondaryBtnText}>Log Paycheck</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ===== Feature Shortcuts ===== */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("PayTracker")}>
            <Wallet size={22} color="#007AFF" />
            <Text style={styles.cardTitle}>Pay Tracker</Text>
            <Text style={styles.cardDesc}>Log new paycheck</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Hours")}>
            <Clock size={22} color="#007AFF" />
            <Text style={styles.cardTitle}>Hour Tracking</Text>
            <Text style={styles.cardDesc}>Validate hours vs pay</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("Budget")}>
            <Calculator size={22} color="#007AFF" />
            <Text style={styles.cardTitle}>Budget Planner</Text>
            <Text style={styles.cardDesc}>Plan & allocate</Text>
          </TouchableOpacity>
        </View>

        {/* Placeholder for future widgets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Features</Text>
          <Text style={styles.sectionText}>
            You’ll soon be able to set payday reminders, track goals, and view insights here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ==================== styles ==================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 20, paddingBottom: 40 },

  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111827" },
  subHeader: { fontSize: 16, color: "#6B7280", marginBottom: 16 },

  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 18,
  },
  overviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  overviewTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  overviewNextPay: { fontSize: 13, color: "#6B7280" },
  overviewNextPayStrong: { color: "#111827", fontWeight: "700" },

  sparkRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 100,
    paddingVertical: 6,
    marginTop: 6,
    gap: 8,
  },
  sparkBarWrap: { alignItems: "center", justifyContent: "flex-end", flex: 1 },
  sparkBar: {
    width: "70%",
    backgroundColor: "#007AFF",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  sparkLabel: { fontSize: 10, color: "#9CA3AF", marginTop: 4 },
  sparkEmpty: { fontSize: 12, color: "#9CA3AF" },

  quickStatsRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statChip: {
    flexGrow: 1,
    flexBasis: "23%",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statLabel: { fontSize: 11, color: "#6B7280" },
  statValue: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 2 },

  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 6,
  },
  card: {
    flexBasis: "31.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginTop: 8 },
  cardDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  section: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 6 },
  sectionText: { fontSize: 14, color: "#6B7280" },

  // Empty state
  emptyState: { alignItems: "flex-start", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  emptyText: { fontSize: 13, color: "#6B7280" },
  emptyActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryBtn: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: { color: "#111827", fontWeight: "600" },
});
