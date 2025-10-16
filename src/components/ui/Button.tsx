import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from 'context/ThemeContext';
import { COLORS } from 'constants/colors';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      gap: 8,
    },
    
    // Variants
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    
    // Sizes
    small: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 36,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      minHeight: 44,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      minHeight: 52,
    },
    
    // States
    disabled: {
      opacity: 0.5,
    },
    fullWidth: {
      width: '100%',
    },
    
    // Text styles
    text: {
      fontWeight: '600',
      textAlign: 'center',
    },
    primaryText: {
      color: COLORS.white,
    },
    secondaryText: {
      color: colors.text,
    },
    outlineText: {
      color: colors.primary,
    },
    ghostText: {
      color: colors.primary,
    },
    disabledText: {
      opacity: 0.7,
    },
    
    // Text sizes
    smallText: {
      fontSize: 14,
    },
    mediumText: {
      fontSize: 16,
    },
    largeText: {
      fontSize: 18,
    },
  });

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {icon && <>{icon}</>}
      <Text style={textStyleCombined}>
        {loading ? 'Loading...' : label}
      </Text>
    </TouchableOpacity>
  );
}

export function ButtonPrimary(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

export function ButtonSecondary(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="secondary" />;
}

export function ButtonOutline(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="outline" />;
}

export function ButtonGhost(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="ghost" />;
}

