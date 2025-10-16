// Centralized color constants for the entire app
// This ensures consistency and maintainability across all components

export const COLORS = {
  // Primary brand colors
  primary: '#007AFF',
  primaryMuted: '#E8F1FF',
  
  // Text colors
  text: '#111827',
  textMuted: '#6B7280',
  textSecondary: '#374151',
  
  // Background colors
  background: '#F9FAFB',
  card: '#FFFFFF',
  surface: '#F3F4F6',
  
  // Border and divider colors
  border: '#D1D5DB',
  divider: '#E5E7EB',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Interactive colors
  active: '#007AFF',
  inactive: '#9CA3AF',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
  
  // White and black
  white: '#FFFFFF',
  black: '#000000',
  
  // Transparent
  transparent: 'transparent',
} as const;

// Dark theme colors
export const DARK_COLORS = {
  // Primary brand colors (same as light)
  primary: '#007AFF',
  primaryMuted: '#1E3A8A',
  
  // Text colors
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  textSecondary: '#D1D5DB',
  
  // Background colors
  background: '#111827',
  card: '#1F2937',
  surface: '#374151',
  
  // Border and divider colors
  border: '#4B5563',
  divider: '#374151',
  
  // Status colors (same as light)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Interactive colors
  active: '#007AFF',
  inactive: '#6B7280',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // White and black
  white: '#FFFFFF',
  black: '#000000',
  
  // Transparent
  transparent: 'transparent',
} as const;

// Color picker options for categories, employers, etc.
export const COLOR_OPTIONS = [
  '#007AFF', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#3F3F46', // Gray
] as const;

// Typography
export const TYPOGRAPHY = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  
  // Font weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// Border radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
