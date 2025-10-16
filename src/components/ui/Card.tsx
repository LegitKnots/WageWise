import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'context/ThemeContext';
import { SHADOWS } from 'constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
  backgroundColor?: string;
}

export function Card({
  children,
  style,
  padding = 'medium',
  shadow = 'small',
  border = true,
  backgroundColor,
}: CardProps) {
  const { colors } = useTheme();
  const cardBackgroundColor = backgroundColor || colors.card;
  
  const styles = StyleSheet.create({
    base: {
      borderRadius: 12,
    },
    
    // Padding variants
    padding_none: {},
    padding_small: {
      padding: 12,
    },
    padding_medium: {
      padding: 16,
    },
    padding_large: {
      padding: 20,
    },
    
    // Shadow variants
    shadow_small: SHADOWS.sm,
    shadow_medium: SHADOWS.md,
    shadow_large: SHADOWS.lg,
    
    // Border
    border: {
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  const cardStyle = [
    styles.base,
    styles[`padding_${padding}`],
    shadow !== 'none' && styles[`shadow_${shadow}`],
    border && styles.border,
    { backgroundColor: cardBackgroundColor },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

