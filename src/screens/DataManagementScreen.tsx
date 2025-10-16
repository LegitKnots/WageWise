import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Download, 
  Upload, 
  Trash2, 
  ChevronLeft,
  AlertTriangle
} from 'lucide-react-native';
import { useTheme } from 'context/ThemeContext';
import { useWageTracker } from 'context/wageTracker';
import { useUser } from 'context/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from 'services/NotificationService';

interface DataManagementScreenProps {
  navigation: any;
}

const DataManagementScreen = ({ navigation }: DataManagementScreenProps) => {
  const { colors } = useTheme();
  const { employers, stats: wageStats } = useWageTracker();
  const { user, reset } = useUser();
  const [isExporting, setIsExporting] = useState(false);

  const exportAllData = async () => {
    try {
      setIsExporting(true);
      
      // Get all data from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const allData: Record<string, any> = {};
      
      for (const key of allKeys) {
        if (key.startsWith('@app:')) {
          const value = await AsyncStorage.getItem(key);
          allData[key] = value ? JSON.parse(value) : null;
        }
      }

      // Create export object
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        user: user,
        wageTracker: {
          employers: employers,
          stats: wageStats,
        },
        allStorageData: allData,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Share the data
      await Share.share({
        message: jsonString,
        title: 'WageWise Data Export',
      });

      Alert.alert('Success', 'Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      '⚠️ DANGER: Reset All Data',
      'This will PERMANENTLY DELETE ALL your data including:\n\n• All employers and paychecks\n• Budget categories and goals\n• Hour tracking data\n• Settings and preferences\n• Notification settings\n\nThis action CANNOT be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I Understand', 
          style: 'destructive', 
          onPress: () => {
            // Second confirmation
            Alert.alert(
              '🚨 FINAL WARNING',
              'Are you absolutely sure you want to delete ALL data?\n\nType "RESET" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Type RESET',
                  style: 'destructive',
                  onPress: () => {
                    Alert.prompt(
                      'Confirm Reset',
                      'Type "RESET" exactly to confirm deletion of all data:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete Everything',
                          style: 'destructive',
                          onPress: async (input: string | undefined) => {
                            if (input?.toUpperCase() === 'RESET') {
                              await performCompleteReset();
                            } else {
                              Alert.alert('Invalid Input', 'You must type "RESET" exactly to confirm.');
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const performCompleteReset = async () => {
    try {
      // Clear ALL AsyncStorage data
      await AsyncStorage.clear();
      
      // Reset user context
      await reset();
      
      // Cancel all notifications
      NotificationService.cancelAllReminders();
      
      // Show success message
      Alert.alert(
        '✅ Reset Complete',
        'All data has been permanently deleted.\n\nPlease close and reopen the app to see the onboarding screen.',
        [
          {
            text: 'OK',
            onPress: () => {
              // The app will show onboarding on next launch since AsyncStorage is cleared
            }
          }
        ]
      );
    } catch (error) {
      console.error('Reset error:', error);
      Alert.alert('Error', 'Failed to reset app data. Please try again.');
    }
  };

  const getDataStats = () => {
    const totalEmployers = employers.length;
    const totalPaychecks = employers.reduce((sum, emp) => sum + (emp.history?.length || 0), 0);
    
    return {
      employers: totalEmployers,
      paychecks: totalPaychecks,
    };
  };

  const stats = getDataStats();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Data Management</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Data Overview */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.employers}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Employers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.paychecks}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Paychecks</Text>
            </View>
          </View>
        </View>

        {/* Export Data */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Export Data</Text>
          <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
            Export all your data to a JSON file for backup or migration purposes.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={exportAllData}
            disabled={isExporting}
          >
            <Download size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Import Data */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Import Data</Text>
          <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
            Import data from a previously exported JSON file.
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => Alert.alert('Coming Soon', 'Import functionality will be available in a future update.')}
          >
            <Upload size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Import Data</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.error, borderWidth: 2 }]}>
          <View style={styles.dangerHeader}>
            <AlertTriangle size={20} color={colors.error} />
            <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          </View>
          <Text style={[styles.dangerWarning, { color: colors.textMuted }]}>
            These actions are irreversible and will permanently delete your data.
          </Text>
          
          <TouchableOpacity
            style={[styles.dangerButton, { backgroundColor: colors.error }]}
            onPress={handleResetApp}
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Data is stored locally on this device. Regular exports are recommended for backup.
        </Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
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
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dangerWarning: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
});

export default DataManagementScreen;
