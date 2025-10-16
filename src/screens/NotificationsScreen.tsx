import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, 
  ChevronLeft,
  TestTube,
  CheckCircle
} from 'lucide-react-native';
import { useTheme } from 'context/ThemeContext';
import { useWageTracker } from 'context/wageTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from 'services/NotificationService';

interface NotificationsScreenProps {
  navigation: any;
}

type AppSettings = { 
  notificationsEnabled: boolean; 
  employerNotifications: Record<string, boolean>;
};

const SETTINGS_KEY = "@app:settings:v1";
const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  employerNotifications: {},
};

const NotificationsScreen = ({ navigation }: NotificationsScreenProps) => {
  const { colors } = useTheme();
  const { employers } = useWageTracker();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setSettings({
          notificationsEnabled: typeof parsed.notificationsEnabled === "boolean" 
            ? parsed.notificationsEnabled 
            : DEFAULT_SETTINGS.notificationsEnabled,
          employerNotifications: parsed.employerNotifications || DEFAULT_SETTINGS.employerNotifications,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (next: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      setSettings(next);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const toggleNotifications = async () => {
    const newValue = !settings.notificationsEnabled;
    
    if (newValue) {
      try {
        await NotificationService.initialize();
        await NotificationService.requestPermissions();
      } catch (error) {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in Settings.',
        );
        return;
      }
    } else {
      NotificationService.cancelAllReminders();
    }

    await saveSettings({ ...settings, notificationsEnabled: newValue });
  };

  const toggleEmployerNotification = async (employerId: string) => {
    const newValue = !settings.employerNotifications[employerId];
    const next = {
      ...settings,
      employerNotifications: {
        ...settings.employerNotifications,
        [employerId]: newValue,
      },
    };
    
    await saveSettings(next);
  };

  const testNotification = async () => {
    try {
      await NotificationService.testNotification();
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification. Please check your notification permissions.');
    }
  };

  const getNotificationStatus = () => {
    if (!settings.notificationsEnabled) return "Off";
    const enabledCount = Object.values(settings.employerNotifications).filter(Boolean).length;
    return enabledCount === 0 ? "No employers" : `${enabledCount} employer${enabledCount === 1 ? '' : 's'}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Enable Notifications</Text>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                Receive payday reminders and important updates
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.notificationsEnabled ? '#FFFFFF' : colors.textMuted}
            />
          </View>
        </View>

        {/* Test Notification */}
        {settings.notificationsEnabled && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Test Notifications</Text>
            <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
              Send a test notification to verify everything is working correctly.
            </Text>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={testNotification}
            >
              <TestTube size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Employer Notifications */}
        {settings.notificationsEnabled && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Employer Notifications</Text>
            <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
              Choose which employers you want to receive payday reminders for.
            </Text>

            {employers.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Bell size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No employers added yet. Add employers in the Wage Tracker to configure notifications.
                </Text>
              </View>
            ) : (
              <View style={styles.employerList}>
                {employers.map((employer) => (
                  <View key={employer.id} style={[styles.employerRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.employerInfo}>
                      <View style={[styles.employerColor, { backgroundColor: employer.color }]} />
                      <Text style={[styles.employerName, { color: colors.text }]}>
                        {employer.name}
                      </Text>
                    </View>
                    <Switch
                      value={settings.employerNotifications[employer.id] || false}
                      onValueChange={() => toggleEmployerNotification(employer.id)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={(settings.employerNotifications[employer.id] || false) ? '#FFFFFF' : colors.textMuted}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Status */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Status</Text>
          <View style={styles.statusRow}>
            <CheckCircle size={20} color={settings.notificationsEnabled ? colors.success : colors.textMuted} />
            <Text style={[styles.statusText, { color: colors.text }]}>
              Notifications: {getNotificationStatus()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  employerList: {
    marginTop: 8,
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  employerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  employerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  employerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationsScreen;
