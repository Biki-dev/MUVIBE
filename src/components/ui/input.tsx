import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Palette, Radius, Spacing, Typography, FontFamily } from '@/constants/theme';
import { AppIcon } from './icon';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  isPassword = false,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  const hasError = !!error;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredMark}>*</Text>}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
        ]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Palette.muted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            hitSlop={8}>
            <AppIcon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Palette.muted}
            />
          </Pressable>
        )}
      </View>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.space3,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.space1 + 2,
  },
  label: {
    ...Typography.supporting,
    fontWeight: '600',
    fontFamily: FontFamily.medium,
    color: Palette.ink,
  },
  requiredMark: {
    color: Palette.coral,
    marginLeft: 3,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.sm, // 10px
    paddingHorizontal: Spacing.space3,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: Palette.forest,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: Palette.coral,
  },
  leftIconContainer: {
    marginRight: Spacing.space2,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Palette.ink,
    paddingVertical: Spacing.space2 + 2,
  },
  eyeButton: {
    padding: Spacing.space1,
    marginLeft: Spacing.space2,
  },
  errorText: {
    ...Typography.supporting,
    color: Palette.coral,
    marginTop: Spacing.space1,
  },
  helperText: {
    ...Typography.supporting,
    color: Palette.muted,
    marginTop: Spacing.space1,
  },
});
