import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Moon, 
  Sun, 
  Monitor, 
  ChevronLeft,
  Check
} from 'lucide-react-native';
import { useTheme } from 'context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeScreenProps {
  navigation: any;
}

const THEME_STORAGE_KEY = '@app:theme_mode';

const ThemeScreen = ({ navigation }: ThemeScreenProps) => {
  const themeCtx = useTheme();
  // Adapt to the context value shape
  const colors = themeCtx.colors;
  const setThemeMode = themeCtx.setThemeMode;
  // Fix: use the correct property for mode from the context, and avoid a non-existent themeMode
  const mode = themeCtx.mode || 'system';
  const [selectedMode, setSelectedMode] = useState<'light' | 'dark' | 'system'>(mode);

  useEffect(() => {
    setSelectedMode(mode);
  }, [mode]);

  const handleThemeChange = async (mode: 'light' | 'dark' | 'system') => {
    try {
      setSelectedMode(mode);
      setThemeMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
      Alert.alert('Error', 'Failed to save theme preference. Please try again.');
    }
  };

  const themeOptions = [
    {
      id: 'light' as const,
      title: 'Light',
      description: 'Always use light theme',
      icon: Sun,
      color: '#FFA500',
    },
    {
      id: 'dark' as const,
      title: 'Dark',
      description: 'Always use dark theme',
      icon: Moon,
      color: '#4A90E2',
    },
    {
      id: 'system' as const,
      title: 'System',
      description: 'Follow device theme',
      icon: Monitor,
      color: '#7B68EE',
    },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Options */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Theme</Text>
          <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
            Select how you want the app to look. You can change this anytime.
          </Text>

          <View style={styles.optionsList}>
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedMode === option.id;
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionRow,
                    { 
                      backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => handleThemeChange(option.id)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                      <IconComponent size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Current Theme Info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Theme</Text>
          <View style={styles.currentThemeInfo}>
            <View style={[styles.themePreview, { backgroundColor: colors.surface }]}>
              <View style={[styles.previewHeader, { backgroundColor: colors.card }]}>
                <View style={[styles.previewDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.previewLine, { backgroundColor: colors.text }]} />
                <View style={[styles.previewLine, { backgroundColor: colors.textMuted, width: '60%' }]} />
              </View>
              <View style={styles.previewContent}>
                <View style={[styles.previewLine, { backgroundColor: colors.text, width: '80%' }]} />
                <View style={[styles.previewLine, { backgroundColor: colors.textMuted, width: '70%' }]} />
                <View style={[styles.previewLine, { backgroundColor: colors.textMuted, width: '50%' }]} />
              </View>
            </View>
            <Text style={[styles.currentThemeText, { color: colors.textMuted }]}>
              {selectedMode === 'system' 
                ? 'Following system theme' 
                : `Using ${selectedMode} theme`}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Theme changes are applied immediately and saved automatically.
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
    marginBottom: 20,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  currentThemeInfo: {
    alignItems: 'center',
  },
  themePreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  previewHeader: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  previewLine: {
    height: 2,
    borderRadius: 1,
    marginBottom: 2,
  },
  previewContent: {
    padding: 4,
  },
  currentThemeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
});

export default ThemeScreen;
