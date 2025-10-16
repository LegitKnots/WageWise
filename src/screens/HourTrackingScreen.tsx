import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Plus, Edit3, Trash2, CheckCircle, Play, Pause, Square } from 'lucide-react-native';
import { useWageTracker } from 'context/wageTracker';
import { useTheme } from 'context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Employer, PayDay } from 'types/wageTracker';

interface HourEntry {
  id: string;
  employerId: string;
  date: Date;
  hoursWorked: number;
  hoursPaid: number;
  notes?: string;
}

interface TimeEntry {
  id: string;
  employerId: string;
  startTime: Date;
  endTime?: Date;
  breakDuration: number; // in minutes
  notes?: string;
  isActive: boolean;
}

const STORAGE_KEY = '@app:hourTracking:v1';

const HourTrackingScreen = () => {
  const { colors } = useTheme();
  const { employers } = useWageTracker();
  const [hourEntries, setHourEntries] = useState<HourEntry[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedEmployer, setSelectedEmployer] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [breakDuration, setBreakDuration] = useState('0');
  const [notes, setNotes] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert date strings back to Date objects
        const hourEntries = (parsed.hourEntries || []).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
        const timeEntries = (parsed.timeEntries || []).map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined
        }));
        setHourEntries(hourEntries);
        setTimeEntries(timeEntries);
      }
    } catch (error) {
      console.error('Error loading hour tracking data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        hourEntries,
        timeEntries,
      }));
    } catch (error) {
      console.error('Error saving hour tracking data:', error);
    }
  };

  // Calculate discrepancies
  const discrepancies = useMemo(() => {
    return hourEntries.map(entry => {
      const employer = employers.find(e => e.id === entry.employerId);
      if (!employer || employer.payStructure.base !== 'hourly') return null;

      const difference = entry.hoursWorked - entry.hoursPaid;
      const percentageDiff = entry.hoursPaid > 0 ? (difference / entry.hoursPaid) * 100 : 0;

      return {
        ...entry,
        employer,
        difference,
        percentageDiff,
        status: Math.abs(percentageDiff) < 5 ? 'good' : Math.abs(percentageDiff) < 15 ? 'warning' : 'error'
      };
    }).filter(Boolean);
  }, [hourEntries, employers]);

  const startTimer = (employerId: string) => {
    if (activeTimer) {
      Alert.alert('Timer Active', 'Please stop the current timer before starting a new one.');
      return;
    }

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      employerId,
      startTime: new Date(),
      breakDuration: 0,
      isActive: true,
    };

    setTimeEntries(prev => [...prev, newEntry]);
    setActiveTimer(newEntry);
  };

  const stopTimer = () => {
    if (!activeTimer) return;

    const updatedEntry = {
      ...activeTimer,
      endTime: new Date(),
      isActive: false,
    };

    setTimeEntries(prev => 
      prev.map(entry => 
        entry.id === activeTimer.id ? updatedEntry : entry
      )
    );
    setActiveTimer(null);
  };

  const calculateHours = (entry: TimeEntry): number => {
    if (!entry.endTime) return 0;
    const diffMs = entry.endTime.getTime() - entry.startTime.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    return Math.max(0, (diffMinutes - entry.breakDuration) / 60);
  };

  const formatDuration = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getEmployerName = (employerId: string): string => {
    const employer = employers.find(e => e.id === employerId);
    return employer?.name || 'Unknown Employer';
  };

  const addHourEntry = () => {
    if (employers.length === 0) {
      Alert.alert('No Employers', 'Please add an employer first before tracking hours.');
      return;
    }
    setShowAddEntry(true);
  };

  const addManualEntry = () => {
    if (!selectedEmployer) {
      Alert.alert('Error', 'Please select an employer.');
      return;
    }

    const newEntry: HourEntry = {
      id: Date.now().toString(),
      employerId: selectedEmployer,
      date: new Date(),
      hoursWorked: 0, // Will be filled by user
      hoursPaid: 0,   // Will be filled by user
      notes: notes.trim() || undefined,
    };

    setHourEntries(prev => [...prev, newEntry]);
    setShowAddEntry(false);
    setSelectedEmployer('');
    setNotes('');
  };

  const editHourEntry = (entry: HourEntry) => {
    // TODO: Open modal to edit hour entry
    Alert.alert('Edit Hour Entry', 'This feature will be implemented in the next update.');
  };

  const deleteHourEntry = (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this hour entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setHourEntries(prev => prev.filter(e => e.id !== id));
        }}
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle size={16} color={colors.success} />;
      case 'warning': return <Clock size={16} color={colors.warning} />;
      case 'error': return <Clock size={16} color={colors.error} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Hour Tracking</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track hours worked vs hours paid</Text>
        </View>

        {/* Active Timer */}
        {activeTimer && (
          <View style={[styles.activeTimerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.timerHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={[styles.timerTitle, { color: colors.text }]}>Active Timer</Text>
            </View>
            <Text style={[styles.timerEmployer, { color: colors.textSecondary }]}>
              {getEmployerName(activeTimer.employerId)}
            </Text>
            <Text style={[styles.timerDuration, { color: colors.primary }]}>
              {formatDuration(calculateHours(activeTimer))}
            </Text>
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: colors.error }]}
              onPress={stopTimer}
            >
              <Square size={16} color="#FFFFFF" />
              <Text style={styles.stopButtonText}>Stop Timer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddEntry(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Employer Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Employer Summary</Text>
          {employers.map(employer => {
            const totalHours = timeEntries
              .filter(entry => entry.employerId === employer.id && entry.endTime)
              .reduce((total, entry) => total + calculateHours(entry), 0);
            
            return (
              <View key={employer.id} style={[styles.employerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.employerHeader}>
                  <Text style={[styles.employerName, { color: colors.text }]}>{employer.name}</Text>
                  <View style={styles.employerActions}>
                    <TouchableOpacity
                      style={[styles.startButton, { backgroundColor: colors.primary }]}
                      onPress={() => startTimer(employer.id)}
                      disabled={!!activeTimer}
                    >
                      <Play size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.totalHours, { color: colors.textSecondary }]}>
                  Total Hours: {formatDuration(totalHours)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>{hourEntries.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Entries</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>
              {discrepancies.filter(d => d?.status === 'good').length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Accurate</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>
              {discrepancies.filter(d => d?.status === 'warning').length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Minor Issues</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryNumber, { color: colors.text }]}>
              {discrepancies.filter(d => d?.status === 'error').length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Major Issues</Text>
          </View>
        </View>

        {/* Add Entry Button */}
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={addHourEntry}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Hour Entry</Text>
        </TouchableOpacity>

        {/* Entries List */}
        {hourEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No hour entries yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Start tracking your hours to ensure you're being paid correctly.
            </Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {discrepancies.map((discrepancy) => {
              if (!discrepancy) return null;
              const { entry, employer, difference, percentageDiff, status } = discrepancy;
              
              return (
                <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryInfo}>
                      <Text style={[styles.employerName, { color: colors.text }]}>{employer.name}</Text>
                      <Text style={[styles.entryDate, { color: colors.textMuted }]}>
                        {entry.date.toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.surface }]}
                        onPress={() => editHourEntry(entry)}
                      >
                        <Edit3 size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.surface }]}
                        onPress={() => deleteHourEntry(entry.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.entryDetails}>
                    <View style={styles.hourRow}>
                      <Text style={[styles.hourLabel, { color: colors.textMuted }]}>Hours Worked:</Text>
                      <Text style={[styles.hourValue, { color: colors.text }]}>{entry.hoursWorked.toFixed(1)}</Text>
                    </View>
                    <View style={styles.hourRow}>
                      <Text style={[styles.hourLabel, { color: colors.textMuted }]}>Hours Paid:</Text>
                      <Text style={[styles.hourValue, { color: colors.text }]}>{entry.hoursPaid.toFixed(1)}</Text>
                    </View>
                    <View style={styles.hourRow}>
                      <Text style={[styles.hourLabel, { color: colors.textMuted }]}>Difference:</Text>
                      <View style={styles.differenceContainer}>
                        {getStatusIcon(status)}
                        <Text style={[
                          styles.differenceValue,
                          { color: getStatusColor(status) }
                        ]}>
                          {difference > 0 ? '+' : ''}{difference.toFixed(1)}h
                          ({percentageDiff > 0 ? '+' : ''}{percentageDiff.toFixed(1)}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Track the hours you actually work versus the hours you're paid for. 
            This helps you identify discrepancies and ensure accurate pay.
          </Text>
        </View>
      </ScrollView>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Hour Entry</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Employer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.employerOptions}>
                  {employers.map(employer => (
                    <TouchableOpacity
                      key={employer.id}
                      style={[
                        styles.employerOption,
                        { 
                          backgroundColor: selectedEmployer === employer.id ? colors.primary : colors.surface,
                          borderColor: colors.border 
                        }
                      ]}
                      onPress={() => setSelectedEmployer(employer.id)}
                    >
                      <Text style={[
                        styles.employerOptionText,
                        { color: selectedEmployer === employer.id ? '#FFFFFF' : colors.text }
                      ]}>
                        {employer.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowAddEntry(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addManualEntry}
              >
                <Text style={styles.modalButtonText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120, // Extra padding to push content up when keyboard appears
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  activeTimerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  timerEmployer: {
    fontSize: 14,
    marginBottom: 8,
  },
  timerDuration: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  employerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  employerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  employerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  employerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    padding: 8,
    borderRadius: 6,
  },
  totalHours: {
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  entriesList: {
    gap: 12,
    marginBottom: 24,
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryInfo: {
    flex: 1,
  },
  employerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 14,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  entryDetails: {
    gap: 8,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hourLabel: {
    fontSize: 14,
  },
  hourValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  differenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  differenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  employerOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  employerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  employerOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontWeight: '600',
  },
});

export default HourTrackingScreen;
