import React, {  } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Bell, User, Database, Palette, Settings } from "lucide-react-native";
import { useUser } from "context/user";
import { useWageTracker } from "context/wageTracker";
import { useTheme } from "context/ThemeContext";

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen = ({ navigation }: SettingsScreenProps) => {
  const { user } = useUser();
  const { employers } = useWageTracker();
  const { colors } = useTheme();
  const themeMode = useTheme().mode || "system";

  const getThemeDisplayName = (mode: string) => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };


  const ListItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    disabled = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1
        }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.listItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
          {icon}
        </View>
        <View style={styles.listItemText}>
          <Text style={[styles.listItemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.listItemSubtitle, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {showChevron && (
        <ChevronRight size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Manage your preferences and data
          </Text>
        </View>

        {/* User Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ListItem
              icon={<User size={20} color={colors.primary} />}
              title="Name"
              subtitle={user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Tap to set your name'}
              onPress={() => navigation.navigate('NameEdit')}
            />
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ListItem
              icon={<Palette size={20} color={colors.primary} />}
              title="Theme"
              subtitle={getThemeDisplayName(themeMode)}
              onPress={() => navigation.navigate('Theme')}
            />
            <ListItem
              icon={<Bell size={20} color={colors.primary} />}
              title="Notifications"
              subtitle={`${employers.length} employers configured`}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ListItem
              icon={<Database size={20} color={colors.primary} />}
              title="Data Management"
              subtitle="Export, import, and manage your data"
              onPress={() => navigation.navigate('DataManagement')}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ListItem
              icon={<Settings size={20} color={colors.textMuted} />}
              title="App Version"
              subtitle="1.0.0"
              onPress={() => {}}
              showChevron={false}
              disabled
            />
            <ListItem
              icon={<Settings size={20} color={colors.textMuted} />}
              title="Build Number"
              subtitle="1"
              onPress={() => {}}
              showChevron={false}
              disabled
            />
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Settings are saved locally on this device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
});

export default SettingsScreen;