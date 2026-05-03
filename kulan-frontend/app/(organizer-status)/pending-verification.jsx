import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { isOrganizerSubmissionReadyForReview } from '@/utils/organizerVerification';
import { COLORS } from '@/constants/loginSignin/authStyles';
import authStorage from '@/auth/storage';
import VerificationNoticeModal from '@/components/common/VerificationNoticeModal';

const STEP_ACTIVE = COLORS.primary;
const STEP_DONE = '#22C55E';
const STEP_MUTED = '#CBD5E1';

const POLL_INTERVAL_MS = 15000;
/** After resubmit, GET /status can briefly still return `rejected` before DB flips to `pending`. One retry avoids a false "failed" modal. */
const STALE_REJECT_RETRY_MS = 700;

export default function PendingVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, setOrganizerStatus } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevVerificationRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const noticeRef = useRef(null);
  const staleRejectRetryRef = useRef(false);

  useEffect(() => {
    noticeRef.current = notice;
  }, [notice]);

  const handleNoticePrimary = useCallback(async () => {
    const current = noticeRef.current;
    if (!current) return;

    if (current.variant === 'success') {
      await authStorage.storeOrganizerStatus('approved');
      setOrganizerStatus('approved');
      setNotice(null);
      router.replace('/(organizer)/dashboard');
      return;
    }

    if (current.variant === 'error') {
      await authStorage.storeOrganizerStatus('rejected');
      setOrganizerStatus('rejected');
      setNotice(null);
      router.replace('/(organizer-status)/verification-failed');
    }
  }, [router, setOrganizerStatus]);

  const fetchStatus = useCallback(async () => {
    if (noticeRef.current) return;

    try {
      let data = await organizerApi.getOrganizerStatus();

      if (data.verificationStatus === 'pending' && !isOrganizerSubmissionReadyForReview(data)) {
        router.replace('/(organizer-status)/resubmit-verification');
        return;
      }

      const prev = prevVerificationRef.current;
      let curr = data.verificationStatus;

      /**
       * Right after resubmit, status can briefly still be `rejected` before the server sets `pending`.
       * Wait once and refetch so we don't show a false "Verification failed" popup.
       */
      if (prev === null && curr === 'rejected' && !staleRejectRetryRef.current) {
        staleRejectRetryRef.current = true;
        await new Promise((resolve) => setTimeout(resolve, STALE_REJECT_RETRY_MS));
        data = await organizerApi.getOrganizerStatus();
        if (data.verificationStatus === 'pending' && !isOrganizerSubmissionReadyForReview(data)) {
          router.replace('/(organizer-status)/resubmit-verification');
          return;
        }
        curr = data.verificationStatus;
      }

      if (prev === 'pending' && curr === 'approved') {
        setNotice({
          variant: 'success',
          title: "You're verified!",
          message:
            'Your organizer account is approved. You can now create and manage events.',
          primaryLabel: 'Go to dashboard',
        });
      } else if (prev === 'pending' && curr === 'rejected') {
        setNotice({
          variant: 'error',
          title: 'Verification failed',
          primaryLabel: 'Continue',
        });
      } else if (prev === null && curr === 'approved') {
        setNotice({
          variant: 'success',
          title: "You're verified!",
          message:
            'Your organizer account is approved. You can now create and manage events.',
          primaryLabel: 'Go to dashboard',
        });
      } else if (prev === null && curr === 'rejected') {
        router.replace('/(organizer-status)/verification-failed');
        return;
      }

      prevVerificationRef.current = curr;
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      staleRejectRetryRef.current = false;
      let alive = true;
      const bootstrap = async () => {
        setLoading(true);
        await fetchStatus();
        if (alive) setLoading(false);
      };
      bootstrap();
      const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
      return () => {
        alive = false;
        clearInterval(id);
      };
    }, [fetchStatus]),
  );

  const handleEditSubmission = () => {
    router.push('/(organizer-status)/resubmit-verification');
  };

  const handleContactSupport = async () => {
    const url = 'mailto:support@kulan.app?subject=Organizer Verification Support';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const steps = [
    { title: 'Submitted', body: 'We received your documents and details.', done: true },
    {
      title: 'Under review',
      body: 'Our team checks your submission — usually within a few business days.',
      done: false,
      current: true,
    },
    { title: 'Decision', body: 'You will be able to publish events once approved.', done: false },
  ];

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.bgGradStart, COLORS.bgGradEnd]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </LinearGradient>
    );
  }

  const showMainUi =
    status?.verificationStatus === 'pending' &&
    isOrganizerSubmissionReadyForReview(status) &&
    !notice;

  return (
    <>
      <VerificationNoticeModal
        visible={notice !== null}
        variant={notice?.variant ?? 'info'}
        title={notice?.title ?? ''}
        message={notice?.message}
        primaryLabel={notice?.primaryLabel ?? 'OK'}
        onPrimary={handleNoticePrimary}
      />

      <LinearGradient colors={[COLORS.bgGradStart, COLORS.bgGradEnd]} style={{ flex: 1 }}>
        {showMainUi ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 36,
            }}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={['#FF7B3F', '#FF9B5C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 28,
                padding: 24,
                marginBottom: 22,
                shadowColor: '#FF7B3F',
                shadowOpacity: 0.35,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 10 },
                elevation: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255,255,255,0.28)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Feather name="shield" size={26} color="#FFFFFF" />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', letterSpacing: 0.3 }}>
                    Organizer verification
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginTop: 2, letterSpacing: -0.4 }}>
                    Review in progress
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.95)' }}>
                Relax — your application is safe with us. We will notify you when there is an update.
              </Text>
            </LinearGradient>

            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textLight, marginBottom: 14, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              What happens next
            </Text>
            <View
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: 20,
                padding: 20,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.06)',
                shadowColor: '#0F172A',
                shadowOpacity: 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              {steps.map((step, index) => (
                <View key={step.title} style={{ flexDirection: 'row', minHeight: index < steps.length - 1 ? 72 : undefined }}>
                  <View style={{ alignItems: 'center', width: 28 }}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: step.done ? STEP_DONE : step.current ? STEP_ACTIVE : STEP_MUTED,
                        borderWidth: step.current && !step.done ? 3 : 0,
                        borderColor: '#FFF',
                      }}
                    />
                    {index < steps.length - 1 ? (
                      <View style={{ flex: 1, width: 2, backgroundColor: '#E2E8F0', marginVertical: 4 }} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingLeft: 10, paddingBottom: index < steps.length - 1 ? 16 : 0 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textDark }}>{step.title}</Text>
                    <Text style={{ fontSize: 14, color: COLORS.textLight, marginTop: 4, lineHeight: 20 }}>{step.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View
              style={{
                backgroundColor: COLORS.cardBg,
                borderRadius: 20,
                padding: 18,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(15,23,42,0.06)',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginBottom: 14 }}>Your submission</Text>
              {[
                { icon: 'briefcase', label: 'Organization', value: status?.organizationName || '—' },
                {
                  icon: 'file-text',
                  label: 'Document',
                  value: status?.hasDocument ? 'Uploaded' : 'Missing',
                  valueColor: status?.hasDocument ? '#16A34A' : COLORS.textLight,
                },
              ].map((row) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: '#FFF7ED',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Feather name={row.icon} size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: COLORS.textLight, fontWeight: '600' }}>{row.label}</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: row.valueColor || COLORS.textDark, marginTop: 2 }} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#FFFBEB',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Feather name="clock" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textLight, fontWeight: '600' }}>Status</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 2 }}>Pending review</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleEditSubmission}
              style={({ pressed }) => ({
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                height: 54,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
                opacity: pressed ? 0.92 : 1,
                shadowColor: COLORS.primary,
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 }}>Edit submission</Text>
            </Pressable>

            <Pressable
              onPress={handleContactSupport}
              style={({ pressed }) => ({
                backgroundColor: COLORS.cardBg,
                borderRadius: 16,
                height: 54,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: 'rgba(255,123,63,0.35)',
                marginBottom: 8,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>Contact support</Text>
            </Pressable>

            <Pressable onPress={handleLogout} style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: COLORS.textLight, fontSize: 15, fontWeight: '600' }}>Sign out</Text>
            </Pressable>
          </ScrollView>
        ) : notice ? (
          <View style={{ flex: 1 }} />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </LinearGradient>
    </>
  );
}
