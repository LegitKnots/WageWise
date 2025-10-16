import { useContext, useMemo } from 'react';
import { safeArray, safeNumber, safeString, safeBoolean } from '../utils/safeAccess';

/**
 * Safe context hook that provides fallback values and prevents render errors
 */
export function useSafeContext<T extends Record<string, any>>(
  context: React.Context<T | null>,
  fallbackValues: T,
  contextName: string = 'Context'
): T {
  const contextValue = useContext(context);
  
  return useMemo(() => {
    if (!contextValue) {
      console.warn(`${contextName} is null or undefined, using fallback values`);
      return fallbackValues;
    }
    
    // Deep merge with fallback values to ensure all required properties exist
    return deepMergeWithFallbacks(fallbackValues, contextValue);
  }, [contextValue, fallbackValues, contextName]);
}

/**
 * Deep merge objects with fallback values, ensuring type safety
 */
function deepMergeWithFallbacks<T extends Record<string, any>>(
  fallback: T,
  source: T
): T {
  const result = { ...fallback };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const fallbackValue = fallback[key];
      
      if (sourceValue === null || sourceValue === undefined) {
        // Keep fallback value
        continue;
      }
      
      if (typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        if (typeof fallbackValue === 'object' && !Array.isArray(fallbackValue)) {
          result[key] = deepMergeWithFallbacks(fallbackValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      } else if (Array.isArray(sourceValue)) {
        result[key] = safeArray(sourceValue, fallbackValue) as T[typeof key];
      } else if (typeof sourceValue === 'number') {
        result[key] = safeNumber(sourceValue, fallbackValue) as T[typeof key];
      } else if (typeof sourceValue === 'string') {
        result[key] = safeString(sourceValue, fallbackValue) as T[typeof key];
      } else if (typeof sourceValue === 'boolean') {
        result[key] = safeBoolean(sourceValue, fallbackValue) as T[typeof key];
      } else {
        result[key] = sourceValue as T[typeof key];
      }
    }
  }
  
  return result;
}

/**
 * Safe theme context hook
 */
export function useSafeTheme() {
  const { ThemeContext } = require('../context/ThemeContext');
  
  const fallbackTheme = {
    colors: {
      background: '#FFFFFF',
      card: '#F8F9FA',
      text: '#000000',
      textMuted: '#6C757D',
      textSecondary: '#6C757D',
      primary: '#007AFF',
      secondary: '#6C757D',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
      border: '#DEE2E6',
      surface: '#F8F9FA',
      tabBarBackground: '#FFFFFF',
      tabBarBorder: '#DEE2E6',
      tabBarActive: '#007AFF',
      tabBarInactive: '#6C757D',
      divider: '#DEE2E6',
    },
    isDark: false,
  };
  
  return useSafeContext(ThemeContext, fallbackTheme, 'Theme');
}

/**
 * Safe wage tracker context hook
 */
export function useSafeWageTracker() {
  const { WageTrackerContext } = require('../context/wageTracker');
  
  const fallbackWageTracker = {
    loading: false,
    employers: [],
    addEmployer: async () => '',
    updateEmployer: async () => {},
    deleteEmployer: async () => {},
    addPayday: async () => {},
    upsertPayday: async () => {},
    deletePaydayByDate: async () => {},
    setEmployerHistory: async () => {},
    nextPayDates: [],
    nextSoonest: null,
    stats: {
      lastNet: 0,
      avgNet: 0,
      ytdNet: 0,
      ytdTax: 0,
    },
  };
  
  return useSafeContext(WageTrackerContext, fallbackWageTracker, 'WageTracker');
}

/**
 * Safe user context hook
 */
export function useSafeUser() {
  const { UserContext } = require('../context/user');
  
  const fallbackUser = {
    user: null,
    setUser: () => {},
    clearUser: () => {},
  };
  
  return useSafeContext(UserContext, fallbackUser, 'User');
}
