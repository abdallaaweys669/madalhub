import React from 'react';
import { View, Pressable, Text } from 'react-native';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import SocialButtons from './SocialButtons';
import styles from '@/constants/loginSignin/authStyles';

export default function AuthTabs({ tab, setTab }) {
  return (
    <>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setTab('login')}
          style={[styles.segmentItem, tab === 'login' && styles.segmentItemActive]}
        >
          <Text style={[styles.segmentText, tab === 'login' && styles.segmentTextActive]}>
            Log In
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('signup')}
          style={[styles.segmentItem, tab === 'signup' && styles.segmentItemActive]}
        >
          <Text style={[styles.segmentText, tab === 'signup' && styles.segmentTextActive]}>
            Sign Up
          </Text>
        </Pressable>
      </View>
      {tab === 'login' ? <LoginForm /> : <SignupForm />}
      <SocialButtons />
    </>
  );
}
