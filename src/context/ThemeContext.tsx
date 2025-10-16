import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Primary colors
  primary: string;
  primaryMuted: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  
  // Interactive colors
  interactive: string;
  interactiveMuted: string;
  
  // Tab bar colors
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

const LIGHT_THEME: ThemeColors = {
  background: '#F9FAFB',
  surface: '#F3F4F6',
  card: '#FFFFFF',
  
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  
  border: '#E5E7EB',
  divider: '#E5E7EB',
  
  primary: '#007AFF',
  primaryMuted: '#E8F1FF',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  interactive: '#007AFF',
  interactiveMuted: '#E8F1FF',
  
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabBarActive: '#007AFF',
  tabBarInactive: '#6B7280',
};

const DARK_THEME: ThemeColors = {
  background: '#1F2937', // Slightly off-black
  surface: '#374151',
  card: '#4B5563',
  
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  
  border: '#4B5563',
  divider: '#4B5563',
  
  primary: '#60A5FA',
  primaryMuted: '#1E3A8A',
  
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  
  interactive: '#60A5FA',
  interactiveMuted: '#1E3A8A',
  
  tabBarBackground: '#1F2937',
  tabBarBorder: '#374151',
  tabBarActive: '#60A5FA',
  tabBarInactive: '#9CA3AF',
};

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const THEME_STORAGE_KEY = '@app:theme_mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>('light');

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    // Get initial system theme
    setSystemColorScheme(Appearance.getColorScheme());

    return () => subscription?.remove();
  }, []);

  // Load saved theme mode
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setMode(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    try {
      setMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark';
    }
    return mode === 'dark';
  }, [mode, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? DARK_THEME : LIGHT_THEME;
  }, [isDark]);

  const value = useMemo(() => ({
    colors,
    mode,
    isDark,
    setThemeMode,
  }), [colors, mode, isDark, setThemeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
