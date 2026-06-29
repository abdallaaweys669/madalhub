import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import { getOrganizerTypes, getVerificationDocumentTypes, checkOrganizerPhoneAvailable } from '@/api/organizer';
import StepProgressBar from '@/components/common/StepProgressBar';
import AppPopup from '@/components/common/AppPopup';
import PhoneCountryInput from '@/components/common/PhoneCountryInput';
import OrganizerTypeGrid, {
  OTHER_ORGANIZER_TYPE_SLUG,
} from '@/features/organizer/verification/components/OrganizerTypeGrid';
import DocumentTypeGrid from '@/features/organizer/verification/components/DocumentTypeGrid';
import VerificationLocationStep from '@/features/organizer/verification/components/VerificationLocationStep';
import VerificationProfileImageStep from '@/features/organizer/verification/components/VerificationProfileImageStep';
import useOrganizerVerificationWizard from '@/features/organizer/verification/hooks/useOrganizerVerificationWizard';
import {
  NO_PROOF_SLUG,
  STEP_TITLES,
  STEP_SUBTITLES,
  VERIFICATION_TOTAL_STEPS,
  NO_PROOF_BANNER,
  NO_PROOF_HINT,
  NO_PROOF_ALERT_TITLE,
  NO_PROOF_ALERT_MESSAGE,
  NO_PROOF_OPTION_LABEL,
  ORG_TYPE_HINT,
} from '@/features/organizer/verification/constants/verificationCopy';
import { hasOnlinePresenceProof } from '@/features/organizer/verification/utils/verificationHelpers';
import { getSectionByStep } from '@/features/organizer/verification/utils/inferResubmitSections';
import { pickVerificationDocument } from '@/features/organizer/verification/utils/pickVerificationDocument';

const ORANGE = '#FF7B3F';
const INPUT_BORDER = 'rgba(255,123,63,0.28)';

const SectionLabel = ({ children }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

export default function VerifyScreen() {
  const router = useGuardedRouter();
  const { logout } = useAuth();
  const params = useLocalSearchParams();

  const initialStep = Math.min(
    VERIFICATION_TOTAL_STEPS,
    Math.max(1, Number(params.step) || 1),
  );
  const sectionMode = params.mode === 'section';
  const sectionMeta = sectionMode ? getSectionByStep(initialStep) : null;
  const insets = useSafeAreaInsets();
  const footerBottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12) + 16;

  const [orgTypes, setOrgTypes] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [popup, setPopup] = useState(null);

  const closePopup = () => setPopup(null);

  const showPopup = ({
    variant = 'warning',
    title,
    message,
    primaryLabel = 'OK',
    onPrimary,
  }) => {
    setPopup({
      variant,
      title,
      message,
      primaryLabel,
      onPrimary: onPrimary || closePopup,
    });
  };

  useEffect(() => {
    Promise.all([getOrganizerTypes(), getVerificationDocumentTypes()])
      .then(([orgRes, docRes]) => {
        setOrgTypes(orgRes?.types ?? []);
        setDocTypes(docRes?.types ?? []);
      })
      .catch(() => {})
      .finally(() => setTypesLoading(false));
  }, []);

  const otherTypeId = useMemo(
    () => orgTypes.find((type) => type.slug === OTHER_ORGANIZER_TYPE_SLUG)?.id ?? null,
    [orgTypes],
  );

  const {
    step,
    form,
    setField,
    goNext,
    goBack,
    canGoNext,
    canSubmitSection,
    submitting,
    submitError,
    submit,
    isNoProofSelected,
    hasExistingDocument,
    existingDocumentLabel,
  } = useOrganizerVerificationWizard({
    onSuccess: () => router.replace('/(organizer-status)/verification-submitted'),
    otherTypeId,
    initialStep,
    sectionMode,
  });

  const handleBack = () => {
    if (sectionMode) {
      router.replace('/(organizer-status)/resubmit-summary');
      return;
    }
    if (step > 1) {
      goBack();
    }
  };

  const handleSelectOrganizerType = (id) => {
    setField('organizerTypeId', id);
    if (id !== otherTypeId) {
      setField('organizerTypeOther', '');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await pickVerificationDocument();
      if (result.error === 'too_large') {
        showPopup({
          variant: 'warning',
          title: 'File too large',
          message: 'Please choose a file under 10 MB.',
        });
        return;
      }
      const asset = result.asset;
      if (!asset) return;

      setField('documentUri', asset.uri);
      setField('documentName', asset.name);
      setField('documentMimeType', asset.mimeType);
    } catch (error) {
      showPopup({
        variant: 'error',
        title: 'Could not pick file',
        message: error?.message || 'Please try again.',
      });
    }
  };

  const validateProofStep = () => {
    if (!form.documentTypeSlug) {
      showPopup({
        variant: 'warning',
        title: 'Select proof type',
        message: `Please choose a document type or select "${NO_PROOF_OPTION_LABEL}".`,
      });
      return false;
    }
    if (
      form.documentTypeSlug === NO_PROOF_SLUG &&
      !hasOnlinePresenceProof(form)
    ) {
      showPopup({
        variant: 'warning',
        title: NO_PROOF_ALERT_TITLE,
        message: NO_PROOF_ALERT_MESSAGE,
      });
      return false;
    }
    if (
      form.documentTypeSlug !== NO_PROOF_SLUG &&
      !form.documentUri &&
      !hasExistingDocument
    ) {
      showPopup({
        variant: 'warning',
        title: 'Upload required',
        message: 'Please upload your verification document.',
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (sectionMode) {
      if (step === 2) {
        setPhoneChecking(true);
        try {
          const { available } = await checkOrganizerPhoneAvailable(form.phone);
          if (!available) {
            showPopup({
              variant: 'error',
              title: 'Phone already in use',
              message:
                'This phone number is already registered to another organizer. Please use a different number.',
            });
            return;
          }
        } catch {
          showPopup({
            variant: 'error',
            title: 'Could not verify phone',
            message: 'Please check your connection and try again.',
          });
          return;
        } finally {
          setPhoneChecking(false);
        }
      }

      if (step === 4 && !validateProofStep()) {
        return;
      }

      if (!canSubmitSection()) {
        return;
      }

      submit();
      return;
    }

    if (step === 2) {
      setPhoneChecking(true);
      try {
        const { available } = await checkOrganizerPhoneAvailable(form.phone);
        if (!available) {
          showPopup({
            variant: 'error',
            title: 'Phone already in use',
            message:
              'This phone number is already registered to another organizer. Please use a different number.',
          });
          return;
        }
        goNext();
      } catch {
        showPopup({
          variant: 'error',
          title: 'Could not verify phone',
          message: 'Please check your connection and try again.',
        });
      } finally {
        setPhoneChecking(false);
      }
      return;
    }

    if (step === 4) {
      if (!validateProofStep()) {
        return;
      }
      goNext();
      return;
    }

    if (step === VERIFICATION_TOTAL_STEPS) {
      submit();
      return;
    }

    goNext();
  };

  const handleProfileImagePick = ({ uri, name, mimeType }) => {
    setField('profileImageUri', uri);
    setField('profileImageName', name);
    setField('profileImageMimeType', mimeType);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          {(step > 1 && !sectionMode) || sectionMode ? (
            <Pressable onPress={handleBack} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#374151" />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          {sectionMode ? (
            <Text style={styles.sectionHeaderTitle} numberOfLines={1}>
              Update {sectionMeta?.title ?? 'section'}
            </Text>
          ) : null}
          {!sectionMode ? (
            <Pressable onPress={logout} hitSlop={10} style={styles.logoutBtnWrap}>
              <Text style={styles.logoutBtn}>Logout</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>

        {!sectionMode ? (
          <StepProgressBar currentStep={step} totalSteps={VERIFICATION_TOTAL_STEPS} style={styles.progressBar} />
        ) : null}

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepTitle}>
            {sectionMode ? sectionMeta?.title ?? STEP_TITLES[step - 1] : STEP_TITLES[step - 1]}
          </Text>
          <Text style={styles.stepSubtitle}>
            {sectionMode
              ? 'Make your changes, then save and resubmit for review.'
              : STEP_SUBTITLES[step - 1]}
          </Text>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <SectionLabel>Organization / team name *</SectionLabel>
              <TextInput
                style={styles.input}
                value={form.organizationName}
                onChangeText={(v) => setField('organizationName', v)}
                placeholder="e.g. TechHub Mogadishu"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />

              <SectionLabel>Organization type *</SectionLabel>
              <View style={styles.typeHintBanner}>
                <Ionicons name="bulb-outline" size={18} color={ORANGE} />
                <Text style={styles.typeHintBannerText}>{ORG_TYPE_HINT}</Text>
              </View>
              <OrganizerTypeGrid
                types={orgTypes}
                selected={form.organizerTypeId}
                onSelect={handleSelectOrganizerType}
                loading={typesLoading}
                otherTypeText={form.organizerTypeOther}
                onOtherTypeTextChange={(value) => setField('organizerTypeOther', value)}
              />
            </View>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <SectionLabel>Phone number *</SectionLabel>
              <PhoneCountryInput
                value={form.phone}
                onChange={(formatted) => setField('phone', formatted)}
                placeholder="612 345 678"
              />

              <SectionLabel>Website (optional)</SectionLabel>
              <TextInput
                style={styles.input}
                value={form.website}
                onChangeText={(v) => setField('website', v)}
                placeholder="https://yoursite.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
              />

              <SectionLabel>Facebook page (optional)</SectionLabel>
              <View style={styles.prefixRow}>
                <Text style={styles.prefix}>fb.com/</Text>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={form.facebook}
                  onChangeText={(v) => setField('facebook', v)}
                  placeholder="yourpage"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>

              <SectionLabel>Instagram handle (optional)</SectionLabel>
              <View style={styles.prefixRow}>
                <Text style={styles.prefix}>@</Text>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={form.instagram}
                  onChangeText={(v) => setField('instagram', v)}
                  placeholder="yourhandle"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {/* ── Step 3 — Location ── */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <VerificationLocationStep
                value={form.location}
                onChange={(v) => setField('location', v)}
              />
            </View>
          )}

          {/* ── Step 4 — Proof ── */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <DocumentTypeGrid
                types={docTypes}
                selected={form.documentTypeSlug}
                onSelect={(slug) => {
                  setField('documentTypeSlug', slug);
                  if (slug === NO_PROOF_SLUG) {
                    setField('documentUri', null);
                    setField('documentName', null);
                    setField('documentMimeType', null);
                  }
                }}
                loading={typesLoading}
              />

              {form.documentTypeSlug && form.documentTypeSlug !== NO_PROOF_SLUG ? (
                <View style={styles.uploadSection}>
                  <SectionLabel>Upload your document</SectionLabel>
                  {form.documentUri ? (
                    <View style={styles.fileRow}>
                      <Ionicons name="document-attach-outline" size={20} color={ORANGE} />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {form.documentName}
                      </Text>
                      <Pressable
                        onPress={() => {
                          setField('documentUri', null);
                          setField('documentName', null);
                          setField('documentMimeType', null);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                      </Pressable>
                    </View>
                  ) : hasExistingDocument ? (
                    <View style={styles.existingDocRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                      <Text style={styles.existingDocText}>{existingDocumentLabel}</Text>
                    </View>
                  ) : null}
                  <Pressable style={styles.uploadBtn} onPress={handlePickDocument}>
                    <Ionicons name="cloud-upload-outline" size={22} color={ORANGE} />
                    <Text style={styles.uploadBtnLabel}>
                      {hasExistingDocument && !form.documentUri
                        ? 'Replace document (JPG, PNG · max 10 MB)'
                        : 'Choose photo (JPG, PNG · max 10 MB)'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {isNoProofSelected ? (
                <View style={styles.onlineProofSection}>
                  <View style={styles.onlineProofBanner}>
                    <Ionicons name="information-circle-outline" size={20} color={ORANGE} />
                    <Text style={styles.onlineProofBannerText}>{NO_PROOF_BANNER}</Text>
                  </View>

                  <SectionLabel>Website</SectionLabel>
                  <TextInput
                    style={styles.input}
                    value={form.website}
                    onChangeText={(v) => setField('website', v)}
                    placeholder="https://yoursite.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="url"
                    autoCapitalize="none"
                  />

                  <SectionLabel>Facebook page</SectionLabel>
                  <View style={styles.prefixRow}>
                    <Text style={styles.prefix}>fb.com/</Text>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={form.facebook}
                      onChangeText={(v) => setField('facebook', v)}
                      placeholder="yourpage"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                    />
                  </View>

                  <SectionLabel>Instagram handle</SectionLabel>
                  <View style={styles.prefixRow}>
                    <Text style={styles.prefix}>@</Text>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      value={form.instagram}
                      onChangeText={(v) => setField('instagram', v)}
                      placeholder="yourhandle"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                    />
                  </View>

                  {!hasOnlinePresenceProof(form) ? (
                    <Text style={styles.onlineProofHint}>{NO_PROOF_HINT}</Text>
                  ) : null}
                </View>
              ) : null}

            </View>
          )}

          {/* ── Step 5 — Profile image ── */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <VerificationProfileImageStep
                imageUri={form.profileImageUri}
                onPick={handleProfileImagePick}
              />
              {submitError ? (
                <Text style={styles.errorMsg}>{submitError}</Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        {submitError && (sectionMode || step !== VERIFICATION_TOTAL_STEPS) ? (
          <Text style={styles.footerError}>{submitError}</Text>
        ) : null}

        {/* Bottom CTA */}
        <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
          {sectionMode || step === VERIFICATION_TOTAL_STEPS ? (
            <Pressable
              style={[
                styles.nextBtn,
                (submitting || (sectionMode && !canSubmitSection())) && styles.nextBtnDisabled,
              ]}
              onPress={handleNext}
              disabled={submitting || (sectionMode && !canSubmitSection())}
              accessibilityRole="button"
            >
              <Text style={styles.nextBtnLabel}>
                {submitting
                  ? 'Submitting…'
                  : sectionMode
                    ? 'Save & Resubmit'
                    : 'Submit for Review'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.nextBtn,
                (!canGoNext() || submitting || phoneChecking) && styles.nextBtnDisabled,
              ]}
              onPress={handleNext}
              disabled={!canGoNext() || submitting || phoneChecking}
              accessibilityRole="button"
            >
              <Text style={styles.nextBtnLabel}>
                {phoneChecking ? 'Checking…' : 'Continue'}
              </Text>
              {!phoneChecking ? <Ionicons name="arrow-forward" size={18} color="#FFFFFF" /> : null}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {popup ? (
        <AppPopup
          visible
          variant={popup.variant || 'info'}
          title={popup.title}
          message={popup.message}
          primaryLabel={popup.primaryLabel || 'OK'}
          onPrimary={popup.onPrimary || closePopup}
          onClose={closePopup}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    gap: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnWrap: {
    minWidth: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  logoutBtn: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  sectionHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  progressBar: {
    paddingTop: 0,
    paddingBottom: 10,
  },
  scroll: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 18,
  },
  stepContent: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  prefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  prefix: {
    paddingLeft: 14,
    paddingRight: 4,
    fontSize: 15,
    color: '#9CA3AF',
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  typeHintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7F3',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,123,63,0.25)',
  },
  typeHintBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  uploadSection: {
    marginTop: 8,
    gap: 8,
  },
  onlineProofSection: {
    marginTop: 8,
    gap: 12,
  },
  onlineProofBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7F3',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,123,63,0.25)',
  },
  onlineProofBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#9A3412',
  },
  onlineProofHint: {
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FFF7F3',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  uploadBtnLabel: {
    fontSize: 13,
    color: ORANGE,
    textAlign: 'center',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF7F3',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#C2410C',
  },
  existingDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  existingDocText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  errorMsg: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerError: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  nextBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
