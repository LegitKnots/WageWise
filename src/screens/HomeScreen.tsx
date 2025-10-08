import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, Clock, Calculator } from "lucide-react-native";

const HomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Welcome back 👋</Text>
        <Text style={styles.subHeader}>Here’s your overview for today</Text>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("PayTracker")}
          >
            <Wallet size={28} color="#007AFF" />
            <Text style={styles.cardTitle}>Pay Tracker</Text>
            <Text style={styles.cardDesc}>Log and track your pay history</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Hours")}
          >
            <Clock size={28} color="#007AFF" />
            <Text style={styles.cardTitle}>Hour Tracking</Text>
            <Text style={styles.cardDesc}>Validate your paycheck accuracy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Budget")}
          >
            <Calculator size={28} color="#007AFF" />
            <Text style={styles.cardTitle}>Budget Planner</Text>
            <Text style={styles.cardDesc}>Plan ahead and balance spending</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB", // light gray background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827", // near-black
  },
  subHeader: {
    fontSize: 16,
    color: "#6B7280", // gray-500
    marginBottom: 25,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  card: {
    flexBasis: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 10,
  },
  cardDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
