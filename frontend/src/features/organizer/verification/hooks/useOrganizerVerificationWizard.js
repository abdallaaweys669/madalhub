import { useState, useCallback, useEffect } from 'react';
import { getOrganizerStatus, submitOrganizerVerification } from '@/api/organizer';
import { parsePhoneValue } from '@/constants/countryCallingCodes';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { NO_PROOF_SLUG, NO_PROOF_ALERT_MESSAGE, VERIFICATION_TOTAL_STEPS } from '../constants/verificationCopy';
import { hasOnlinePresenceProof } from '../utils/verificationHelpers';

const INITIAL_STATE = {
  organizationName: '',
  organizerTypeId: null,
  organizerTypeOther: '',
  phone: '',
  website: '',
  facebook: '',
  instagram: '',
  location: '',
  documentTypeSlug: null,
  documentUri: null,
  documentName: null,
  documentMimeType: null,
  profileImageUri: null,
  profileImageName: null,
  profileImageMimeType: null,
};

export default function useOrganizerVerificationWizard({
  onSuccess,
  otherTypeId = null,
  initialStep = 1,
  sectionMode = false,
}) {
  const [step, setStep] = useState(initialStep);
  const [form, setForm] = useState(INITIAL_STATE);
  const [hasExistingDocument, setHasExistingDocument] = useState(false);
  const [existingDocumentLabel, setExistingDocumentLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    getOrganizerStatus()
      .then((status) => {
        if (cancelled || !status) return;

        const hasDoc = Boolean(status.hasDocument);
        const onlineProof = hasOnlinePresenceProof(status);
        let documentTypeSlug = status.documentTypeSlug ?? null;

        if (!documentTypeSlug && hasDoc) {
          documentTypeSlug = status.documentTypeSlug || 'business_license';
        }
        if (!documentTypeSlug && !hasDoc && onlineProof) {
          documentTypeSlug = NO_PROOF_SLUG;
        }

        const profileUri = resolveApiAssetUrl(status.profileImg) || null;

        setHasExistingDocument(hasDoc);
        setExistingDocumentLabel(
          hasDoc ? 'Previously uploaded document on file' : '',
        );

        setForm((prev) => ({
          ...prev,
          organizationName: status.organizationName?.trim() || prev.organizationName,
          organizerTypeId: status.organizerTypeId ?? prev.organizerTypeId,
          organizerTypeOther: status.organizerTypeOther?.trim() || prev.organizerTypeOther,
          phone: status.phone?.trim() || prev.phone,
          website: status.website?.trim() || prev.website,
          facebook: status.facebook?.trim() || prev.facebook,
          instagram: status.instagram?.trim() || prev.instagram,
          location: status.location?.trim() || prev.location,
          documentTypeSlug: documentTypeSlug ?? prev.documentTypeSlug,
          profileImageUri: profileUri || prev.profileImageUri,
        }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const isOtherTypeSelected =
    otherTypeId != null && form.organizerTypeId === otherTypeId;

  const step1Valid =
    form.organizationName.trim().length >= 2 &&
    form.organizerTypeId != null &&
    (!isOtherTypeSelected || form.organizerTypeOther.trim().length >= 2);

  const step2Valid = (() => {
    const { nationalNumber } = parsePhoneValue(form.phone);
    return nationalNumber.replace(/\D/g, '').length >= 6;
  })();

  const step3Valid = form.location.trim().length >= 3;

  const isNoProofSelected = form.documentTypeSlug === NO_PROOF_SLUG;
  const hasNewDocumentProof =
    form.documentTypeSlug &&
    form.documentTypeSlug !== NO_PROOF_SLUG &&
    form.documentUri;
  const hasExistingDocumentProof =
    form.documentTypeSlug &&
    form.documentTypeSlug !== NO_PROOF_SLUG &&
    hasExistingDocument &&
    !form.documentUri;

  const step4Valid =
    form.documentTypeSlug != null &&
    (isNoProofSelected
      ? hasOnlinePresenceProof(form)
      : Boolean(hasNewDocumentProof || hasExistingDocumentProof));

  const step5Valid = true;

  const goNext = () => {
    if (sectionMode) return;
    if (step < VERIFICATION_TOTAL_STEPS) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (sectionMode) return;
    if (step > 1) setStep((s) => s - 1);
  };

  const canGoNext = () => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    if (step === 3) return step3Valid;
    if (step === 4) return step4Valid;
    if (step === 5) return step5Valid;
    return true;
  };

  const canSubmitSection = () => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    if (step === 3) return step3Valid;
    if (step === 4) return step4Valid;
    if (step === 5) return step5Valid;
    return true;
  };

  const submit = useCallback(async () => {
    setSubmitError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('organizationName', form.organizationName.trim());
      if (form.organizerTypeId != null) {
        formData.append('organizerTypeId', String(form.organizerTypeId));
      }
      if (form.organizerTypeOther.trim()) {
        formData.append('organizerTypeOther', form.organizerTypeOther.trim());
      }
      if (!form.phone.trim()) {
        throw new Error('Phone number is required.');
      }
      formData.append('phone', form.phone.trim());
      if (!form.location.trim()) {
        throw new Error('Location is required.');
      }
      formData.append('location', form.location.trim());
      if (form.website.trim()) formData.append('website', form.website.trim());
      if (form.facebook.trim()) formData.append('facebook', form.facebook.trim());
      if (form.instagram.trim()) formData.append('instagram', form.instagram.trim());

      const hasNewProof =
        form.documentTypeSlug &&
        form.documentTypeSlug !== NO_PROOF_SLUG &&
        form.documentUri;

      const hasExistingProof =
        form.documentTypeSlug &&
        form.documentTypeSlug !== NO_PROOF_SLUG &&
        hasExistingDocument &&
        !form.documentUri;

      if (!hasNewProof && !hasExistingProof && !hasOnlinePresenceProof(form)) {
        throw new Error(NO_PROOF_ALERT_MESSAGE);
      }

      if (hasNewProof) {
        formData.append('documentTypeSlug', form.documentTypeSlug);
        formData.append('document', {
          uri: form.documentUri,
          name: form.documentName || 'document',
          type: form.documentMimeType || 'application/octet-stream',
        });
      } else if (hasExistingProof) {
        formData.append('documentTypeSlug', form.documentTypeSlug);
        formData.append('keepExistingDocument', '1');
      } else if (isNoProofSelected) {
        formData.append('documentTypeSlug', NO_PROOF_SLUG);
      }

      if (form.profileImageUri && !/^https?:\/\//i.test(form.profileImageUri)) {
        formData.append('profileImage', {
          uri: form.profileImageUri,
          name: form.profileImageName || 'profile.jpg',
          type: form.profileImageMimeType || 'image/jpeg',
        });
      }

      await submitOrganizerVerification(formData);
      onSuccess?.();
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [form, hasExistingDocument, isNoProofSelected, onSuccess]);

  return {
    step,
    form,
    setField,
    goNext,
    goBack,
    canGoNext,
    canSubmitSection,
    step1Valid,
    step2Valid,
    step3Valid,
    step4Valid,
    step5Valid,
    isNoProofSelected,
    hasExistingDocument,
    existingDocumentLabel,
    hasOnlinePresenceProof: hasOnlinePresenceProof(form),
    submitting,
    submitError,
    submit,
    sectionMode,
    totalSteps: VERIFICATION_TOTAL_STEPS,
  };
}
