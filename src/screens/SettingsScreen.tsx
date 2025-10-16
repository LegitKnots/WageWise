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
import { ChevronRight, Bell, User, Check, Trash2, Palette } from "lucide-react-native";
import { useUser } from "context/user";
import { useWageTracker } from "context/wageTracker";
import { useTheme } from "context/ThemeContext";
import NotificationService from "services/NotificationService";

/* ------------ Settings types & storage ------------ */
type AppSettings = { 
  notificationsEnabled: boolean; 
  employerNotifications: Record<string, boolean>; // employerId -> enabled
};

const SETTINGS_KEY = "@app:settings:v1";
const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  employerNotifications: {},
};

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
  const { colors } = useTheme();
  
  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === "ios" ? "slide" : "fade"}
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.sheetBody}>{children}</ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ------------ Main Screen ------------ */
const SettingsScreen = () => {
  // user
  const { user, updateFirstName, updateLastName, reset: resetUser } = useUser();
  const { employers } = useWageTracker();
  const { colors, mode, setThemeMode } = useTheme();

  // settings
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // modals
  const [showName, setShowName] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  // local form states
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [notifEnabled, setNotifEnabled] = useState<boolean>(DEFAULT_SETTINGS.notificationsEnabled);
  const [employerNotifStates, setEmployerNotifStates] = useState<Record<string, boolean>>({});

  /* Load persisted settings once */
  const loadSettings = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
      const next: AppSettings = {
        notificationsEnabled:
          typeof parsed.notificationsEnabled === "boolean" ? parsed.notificationsEnabled : DEFAULT_SETTINGS.notificationsEnabled,
        employerNotifications: parsed.employerNotifications || DEFAULT_SETTINGS.employerNotifications,
      };
      setSettings(next);
      setNotifEnabled(next.notificationsEnabled);
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setNotifEnabled(DEFAULT_SETTINGS.notificationsEnabled);
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
    const enabledCount = Object.values(settings.employerNotifications).filter(Boolean).length;
    const totalCount = employers.length;
    if (totalCount === 0) return "No employers";
    return `${enabledCount}/${totalCount} employers`;
  }, [settings, employers.length]);

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
    setEmployerNotifStates(settings.employerNotifications);
    setShowNotifications(true);
  };

  const saveNotifications = async () => {
    await saveSettings({ 
      notificationsEnabled: notifEnabled, 
      employerNotifications: employerNotifStates 
    });
    
    if (notifEnabled) {
      await NotificationService.initialize();
      await NotificationService.requestPermissions();
    } else {
      NotificationService.cancelAllReminders();
    }
    
    setShowNotifications(false);
  };

  const toggleEmployerNotification = (employerId: string) => {
    setEmployerNotifStates(prev => ({
      ...prev,
      [employerId]: !prev[employerId]
    }));
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App Data',
      'This will delete all your data including employers, paychecks, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Clear all app data
              await AsyncStorage.multiRemove([
                '@app:user',
                '@app:wageTracker:v3',
                '@app:settings:v1',
                '@app:onboarding_completed'
              ]);
              
              // Reset user context
              await resetUser();
              
              // Cancel all notifications
              NotificationService.cancelAllReminders();
              
              Alert.alert('Success', 'App data has been reset. Please restart the app.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app data. Please try again.');
            }
          }
        }
      ]
    );
  };

  /* UI */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: colors.text }]}>Settings</Text>

        {/* List of options */}
        <View style={[styles.listCard, { backgroundColor: colors.card }]}>
                  <ListItem
                    icon={<User size={18} color={colors.primary} />}
                    title="Name"
                    subtitle={nameSummary}
                    onPress={openName}
                  />
                  <Separator />
                  <ListItem
                    icon={<Bell size={18} color={colors.primary} />}
                    title="Notifications"
                    subtitle={notifSummary}
                    onPress={openNotifications}
                  />
                  <Separator />
                  <ListItem
                    icon={<Bell size={18} color={colors.primary} />}
                    title="Test Notification"
                    subtitle="Send a test notification"
                    onPress={async () => {
                      await NotificationService.testNotification();
                    }}
                  />
                  <Separator />
                  <ListItem
                    icon={<Palette size={18} color={colors.primary} />}
                    title="Theme"
                    subtitle={mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'}
                    onPress={() => setShowTheme(true)}
                  />
        </View>

        {/* Advanced Settings */}
        <View style={[styles.listCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Advanced</Text>
          <ListItem
            icon={<Trash2 size={18} color={colors.error} />}
            title="Reset App Data"
            subtitle={`${employers.length} employers, all paychecks`}
            onPress={handleResetApp}
          />
        </View>

        {!loading && (
          <Text style={[styles.footerNote, { color: colors.textMuted }]}>Settings are saved locally on this device.</Text>
        )}
      </ScrollView>

      {/* -------- Name Modal -------- */}
      <PageSheet visible={showName} onClose={() => setShowName(false)} title="Edit Name">
        <View style={styles.formRow}>
          <Text style={[styles.formLabel, { color: colors.text }]}>First name</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text 
            }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.formRow}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Last name</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text 
            }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.sheetActions}>
          <TouchableOpacity 
            style={[styles.secondaryBtn, { borderColor: colors.border }]} 
            onPress={() => setShowName(false)}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]} 
            onPress={saveName}
          >
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </PageSheet>

      {/* -------- Notifications Modal -------- */}
      <PageSheet visible={showNotifications} onClose={() => setShowNotifications(false)} title="Notifications">
        <View style={[styles.formRow, styles.switchRow]}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Enable notifications</Text>
          <Switch 
            value={notifEnabled} 
            onValueChange={setNotifEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={[
          styles.sectionLabel, 
          { 
            marginTop: 16, 
            marginBottom: 12,
            opacity: notifEnabled ? 1 : 0.5,
            color: colors.text 
          }
        ]}>
          Notify for these employers
        </Text>

        {employers.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No employers added yet. Add employers in the Wage Tracker to configure notifications.
            </Text>
          </View>
        ) : (
          <View style={styles.optionGroup}>
            {employers.map((employer, index) => {
              const isEnabled = employerNotifStates[employer.id] || false;
              return (
                <View
                  key={employer.id}
                  style={[
                    styles.optionRow,
                    { 
                      opacity: notifEnabled ? 1 : 0.5,
                      borderBottomColor: colors.border,
                      borderBottomWidth: index === employers.length - 1 ? 0 : 1
                    },
                  ]}
                >
                  <View style={styles.employerRow}>
                    <View style={[styles.employerColor, { backgroundColor: employer.color }]} />
                    <Text style={[styles.optionTitle, { color: colors.text }]}>{employer.name}</Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => toggleEmployerNotification(employer.id)}
                    disabled={!notifEnabled}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.sheetActions}>
          <TouchableOpacity 
            style={[styles.secondaryBtn, { borderColor: colors.border }]} 
            onPress={() => setShowNotifications(false)}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]} 
            onPress={saveNotifications}
          >
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </PageSheet>

      {/* -------- Theme Modal -------- */}
      <PageSheet visible={showTheme} onClose={() => setShowTheme(false)} title="Theme">
        <Text style={[styles.sectionLabel, { marginBottom: 12, color: colors.text }]}>
          Choose your preferred theme
        </Text>

        <View style={styles.optionGroup}>
          {[
            { value: 'light', label: 'Light', description: 'Always use light theme' },
            { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
            { value: 'system', label: 'System', description: 'Follow system setting' },
          ].map((option) => {
            const active = mode === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setThemeMode(option.value as any)}
                style={[styles.optionRow, { borderBottomColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.optionHelper, { color: colors.textMuted }]}>{option.description}</Text>
                </View>
                {active ? <Check size={20} color={colors.primary} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sheetActions}>
          <TouchableOpacity 
            style={[styles.secondaryBtn, { borderColor: colors.border }]} 
            onPress={() => setShowTheme(false)}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Done</Text>
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
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.listItem}>
      <View style={styles.listLeft}>
        {icon ? <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>{icon}</View> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.listTitle, { color: colors.text }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.listSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        </View>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function Separator() {
  const { colors } = useTheme();
  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

/* ------------ styles ------------ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  header: { fontSize: 22, fontWeight: "700" },

  listCard: {
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
    justifyContent: "center",
    alignItems: "center",
  },
  listTitle: { fontSize: 15, fontWeight: "600" },
  listSubtitle: { fontSize: 12, marginTop: 2 },
  separator: { height: 1 },

  footerNote: { fontSize: 12, textAlign: "center", marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 20, paddingHorizontal: 16 },

  /* page sheet */
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetBody: { padding: 20, gap: 12 },

  /* forms */
  formRow: { gap: 6 },
  formLabel: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  sectionLabel: { fontSize: 13, fontWeight: "600" },

  optionGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  optionTitle: { fontSize: 14, fontWeight: "600" },
  optionHelper: { fontSize: 12 },
  
  /* employer notification rows */
  employerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  employerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  /* buttons */
  sheetActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryBtnText: { fontWeight: "600" },
  primaryBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700" },
});
