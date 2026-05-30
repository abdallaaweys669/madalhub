import React from 'react';
import { StyleSheet, View } from 'react-native';
import AuthCheckbox from '@/features/auth/components/AuthCheckbox';
import AuthForgotPassword from '@/features/auth/components/AuthForgotPassword';

export default function AuthKeepLoggedIn({ checked, onToggle }) {
  return (
    <View style={styles.row}>
      <AuthCheckbox
        checked={checked}
        onPress={onToggle}
        label="Keep me logged in"
        wrapStyle={styles.checkboxWrap}
      />
      {/* TODO: wire up forgot-password flow (send reset link to user email) */}
      <AuthForgotPassword onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 20,
  },
  checkboxWrap: {
    marginBottom: 0,
  },
});
