import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import useAuth from '@/auth/useAuth';
import onboardingApi from '@/api/onboarding';
import { COLORS } from '@/constants/loginSignin/authStyles';
import TextField from '@/features/auth/components/TextField';
import VerificationNoticeModal from '@/components/common/VerificationNoticeModal';

/** Must match MySQL enum on `organizer_verification_documents.document_type` (see onboarding resolveDocumentType). */
const DOCUMENT_TYPES = [
  { value: 'business_license', label: 'Business license' },
  { value: 'other', label: 'Other' },
];

export default function ResubmitVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const handleCancel = async () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    await logout();
    router.replace('/(auth)/welcome');
  };

  const [values, setValues] = useState({
    organizationName: '',
    organizationDescription: '',
    website: '',
    documentType: 'business_license',
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const pickDocument = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please grant access to your photo library to upload a document.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setDocumentFile(result.assets[0]);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!values.organizationName.trim()) newErrors.organizationName = 'Organization name is required';
    if (!values.organizationDescription.trim()) newErrors.organizationDescription = 'Organization description is required';
    if (!documentFile) newErrors.document = 'Document is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await onboardingApi.updateOrganizerProfile({
        organization_name: values.organizationName,
        organization_description: values.organizationDescription,
        website: values.website || undefined,
      });

      if (documentFile) {
        const formData = new FormData();
        formData.append('file', {
          uri: documentFile.uri,
          name: documentFile.fileName || 'document.jpg',
          type: documentFile.mimeType || 'image/jpeg',
        });
        formData.append('document_type', values.documentType);

        await onboardingApi.uploadOrganizerDocument(formData);
      }

      setShowSubmittedModal(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resubmit verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmittedContinue = () => {
    setShowSubmittedModal(false);
    router.replace('/(organizer-status)/pending-verification');
  };

  return (
    <LinearGradient colors={[COLORS.bgGradStart, COLORS.bgGradEnd]} style={{ flex: 1 }}>
      <VerificationNoticeModal
        visible={showSubmittedModal}
        variant="info"
        title="Submitted for review"
        message="Thanks — we received your details and document. Our team will review your submission and you’ll see updates on your status screen."
        primaryLabel="View status"
        onPrimary={handleSubmittedContinue}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 8 }}>
            Complete verification
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.textLight, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            Add your organization details and upload a verification document. After you submit, your account will be
            reviewed by an admin.
          </Text>

          <View
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: 16,
              paddingHorizontal: 20,
              paddingVertical: 24,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <TextField
              label="Organization Name"
              value={values.organizationName}
              onChangeText={(v) => onChange('organizationName', v)}
              error={errors.organizationName || ''}
              placeholder="Enter organization name"
              autoCapitalize="words"
            />

            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 }}>
                Organization Description
              </Text>
              <View
                style={{
                  borderWidth: errors.organizationDescription ? 1 : 1,
                  borderColor: errors.organizationDescription ? 'red' : COLORS.inputBorder,
                  borderRadius: 12,
                  backgroundColor: COLORS.inputBg,
                  padding: 12,
                  minHeight: 80,
                }}
              >
                <TextInput
                  multiline
                  value={values.organizationDescription}
                  onChangeText={(v) => onChange('organizationDescription', v)}
                  placeholder="Describe your organization..."
                  style={{ fontSize: 15, color: COLORS.textDark }}
                />
              </View>
              {errors.organizationDescription ? (
                <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{errors.organizationDescription}</Text>
              ) : null}
            </View>

            <View style={{ marginTop: 16 }}>
              <TextField
                label="Website (optional)"
                value={values.website}
                onChangeText={(v) => onChange('website', v)}
                error=""
                placeholder="https://yourwebsite.com"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 }}>
                Document type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {DOCUMENT_TYPES.map((opt) => {
                  const selected = values.documentType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => onChange('documentType', opt.value)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: selected ? COLORS.primary : COLORS.inputBorder,
                        backgroundColor: selected ? '#FFF3E0' : COLORS.inputBg,
                        marginRight: 10,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: selected ? COLORS.primary : COLORS.textDark,
                        }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 8 }}>
                Verification Document
              </Text>
              <Pressable
                onPress={pickDocument}
                style={{
                  borderWidth: 2,
                  borderColor: errors.document ? 'red' : COLORS.primary,
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  padding: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 80,
                }}
              >
                {documentFile ? (
                  <Text style={{ color: '#22C55E', fontWeight: '600' }}>
                    Document selected: {documentFile.fileName || 'image'}
                  </Text>
                ) : (
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                    Tap to select document
                  </Text>
                )}
              </Pressable>
              {errors.document ? (
                <Text style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{errors.document}</Text>
              ) : null}
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 14,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 28,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                  Submit for Review
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleCancel}
              style={{
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ color: COLORS.textLight, fontSize: 14, fontWeight: '600' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
