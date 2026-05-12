import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { COLORS } from '@/constants/loginSignin/authStyles';

export default function AuthFormScaffold({
  title,
  subtitle,
  children,
  compact = false,
}) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cardBg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : compact ? undefined : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : compact ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: compact ? 20 : 40,
            paddingBottom: compact ? 40 : 120,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="always"
        >
          <View style={{ marginBottom: 25, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: compact ? '700' : '800',
                color: COLORS.primary,
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={{
                  textAlign: 'center',
                  marginTop: 6,
                  color: COLORS.textLight,
                  fontSize: 15,
                  opacity: 0.9,
                  width: '90%',
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: 26,
              paddingVertical: compact ? 35 : 34,
              paddingHorizontal: 24,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
