// screens/SettingsScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronRight, Bell, User, Check } from "lucide-react-native";
import { useUser } from "context/user";

/* ------------ Settings types & storage ------------ */
type AlertTiming = "twoHoursAfter" | "eightAmSameDay" | "noonDayAfter";
type AppSettings = { notificationsEnabled: boolean; alertTiming: AlertTiming };

const SETTINGS_KEY = "@app:settings:v1";
const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  alertTiming: "eightAmSameDay",
};

const TIMING_OPTIONS: { label: string; value: AlertTiming; helper?: string }[] = [
  { label: "2 hours after payday", value: "twoHoursAfter", helper: "Good if pay posts midday" },
  { label: "8:00 AM on payday", value: "eightAmSameDay", helper: "Morning prompt" },
  { label: "12:00 PM next day", value: "noonDayAfter", helper: "If pay posts overnight" },
];

const timingLabel = (val: AlertTiming) => TIMING_OPTIONS.find(o => o.value === val)?.label ?? "";

/* ------------ PageSheet wrapper ------------ */
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
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.sheetBody}>{children}</ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ------------ Main Screen ------------ */
const SettingsScreen = () => {
  // user
  const { user, updateFirstName, updateLastName } = useUser();

  // settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // modals
  const [showName, setShowName] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // local form states
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [notifEnabled, setNotifEnabled] = useState<boolean>(DEFAULT_SETTINGS.notificationsEnabled);
  const [notifTiming, setNotifTiming] = useState<AlertTiming>(DEFAULT_SETTINGS.alertTiming);

  /* Load persisted settings once */
  const loadSettings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
      const next: AppSettings = {
        notificationsEnabled:
          typeof parsed.notificationsEnabled === "boolean" ? parsed.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled,
        alertTiming: (parsed.alertTiming as AlertTiming) || DEFAULT_SETTINGS.alertTiming,
      };
      setSettings(next);
      setNotifEnabled(next.notificationsEnabled);
      setNotifTiming(next.alertTiming);
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setNotifEnabled(DEFAULT_SETTINGS.notificationsEnabled);
      setNotifTiming(DEFAULT_SETTINGS.alertTiming);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (next: AppSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* List summaries */
  const nameSummary = useMemo(() => {
    const fn = user.firstName?.trim();
    const ln = user.lastName?.trim();
    if (!fn && !ln) return "Not set";
    return [fn, ln].filter(Boolean).join(" ");
  }, [user.firstName, user.lastName]);

  const notifSummary = useMemo(() => {
    if (!settings.notificationsEnabled) return "Off";
    return timingLabel(settings.alertTiming);
  }, [settings]);

  /* Actions */
  const openName = () => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setShowName(true);
  };

  const saveName = async () => {
    await updateFirstName(firstName.trim());
    await updateLastName(lastName.trim());
    setShowName(false);
  };

  const openNotifications = () => {
    setNotifEnabled(settings.notificationsEnabled);
    setNotifTiming(settings.alertTiming);
    setShowNotifications(true);
  };

  const saveNotifications = async () => {
    await saveSettings({ notificationsEnabled: notifEnabled, alertTiming: notifTiming });
    setShowNotifications(false);
  };

  /* UI */
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Settings</Text>

        {/* List of options */}
        <View style={styles.listCard}>
          <ListItem
            icon={<User size={18} color="#111827" />}
            title="Name"
            subtitle={nameSummary}
            onPress={openName}
          />
          <Separator />
          <ListItem
            icon={<Bell size={18} color="#111827" />}
            title="Notifications"
            subtitle={notifSummary}
            onPress={openNotifications}
          />
        </View>

        {!loading && (
          <Text style={styles.footerNote}>Settings are saved locally on this device.</Text>
        )}
      </ScrollView>

      {/* -------- Name Modal -------- */}
      <PageSheet visible={showName} onClose={() => setShowName(false)} title="Edit Name">
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>First name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.formLabel}>Last name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowName(false)}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={saveName}>
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </PageSheet>

      {/* -------- Notifications Modal -------- */}
      <PageSheet visible={showNotifications} onClose={() => setShowNotifications(false)} title="Notifications">
        <View style={[styles.formRow, styles.switchRow]}>
          <Text style={styles.formLabel}>Enable notifications</Text>
          <Switch value={notifEnabled} onValueChange={setNotifEnabled} />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 6, opacity: notifEnabled ? 1 : 0.5 }]}>
          Reminder timing
        </Text>

        <View style={styles.optionGroup}>
          {TIMING_OPTIONS.map((opt) => {
            const active = notifTiming === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                disabled={!notifEnabled}
                onPress={() => setNotifTiming(opt.value)}
                style={[
                  styles.optionRow,
                  { opacity: notifEnabled ? 1 : 0.5 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{opt.label}</Text>
                  {opt.helper ? <Text style={styles.optionHelper}>{opt.helper}</Text> : null}
                </View>
                {active ? <Check size={20} color="#007AFF" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowNotifications(false)}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={saveNotifications}>
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </PageSheet>
    </SafeAreaView>
  );
};

export default SettingsScreen;

/* ------------ Small components ------------ */
function ListItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.listItem}>
      <View style={styles.listLeft}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.listSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <ChevronRight size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

/* ------------ styles ------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  header: { fontSize: 22, fontWeight: "700", color: "#111827" },

  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  listTitle: { color: "#111827", fontSize: 15, fontWeight: "600" },
  listSubtitle: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  separator: { height: 1, backgroundColor: "#E5E7EB" },

  footerNote: { fontSize: 12, color: "#6B7280", textAlign: "center", marginTop: 8 },

  /* page sheet */
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    backgroundColor: "#FFFFFF",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  sheetBody: { padding: 20, gap: 12 },

  /* forms */
  formRow: { gap: 6 },
  formLabel: { fontSize: 13, color: "#374151", fontWeight: "600" },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#111827",
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },

  optionGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  optionTitle: { color: "#111827", fontSize: 14, fontWeight: "600" },
  optionHelper: { color: "#6B7280", fontSize: 12 },

  /* buttons */
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  secondaryBtn: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: { color: "#111827", fontWeight: "600" },
  primaryBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
