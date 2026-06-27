import apiClient from './client';
import { createOrganizerEvent, getEvents, patchOrganizerEvent, publishOrganizerEvent } from './events';

const getNetworkErrorMessage = (error) => {
  const code = error?.code;
  if (code === 'ECONNABORTED') {
    return 'Connection timed out. Make sure your backend tunnel is running and try again.';
  }
  return 'Network error. Check your internet connection and API tunnel URL.';
};

const extractApiMessage = (error) => {
  const data = error?.response?.data;
  if (!data) return null;
  const m = data.message;
  if (Array.isArray(m)) return m.filter(Boolean).join(', ');
  if (typeof m === 'string' && m.trim()) return m.trim();
  return null;
};

export const organizerRegister = async (organizerInfo) => {
  try {
    const response = await apiClient.post('/organizer/register', organizerInfo);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Organizer registration failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const organizerLogin = async (credentials) => {
  const body = {
    email: (credentials?.email ?? '').trim().toLowerCase(),
    password: credentials?.password ?? '',
  };
  try {
    const response = await apiClient.post('/organizer/login', body);
    const data = response.data;
    return {
      token: data.access_token,
      organizerStatus: data.organizerStatus || 'unverified',
      rejectionReason: data.rejectionReason || null,
      freePublishUsed: Boolean(data.freePublishUsed),
      paidPublishCredits: Number(data.paidPublishCredits ?? 0),
    };
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Organizer login failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const organizerSocialLogin = async ({ provider, idToken, accessToken, fullName, email }) => {
  try {
    const response = await apiClient.post('/organizer/social-login', {
      provider,
      idToken,
      accessToken,
      fullName,
      email,
    });
    const data = response.data;
    return {
      token: data.access_token,
      organizerStatus: data.organizerStatus || 'unverified',
      rejectionReason: data.rejectionReason || null,
      freePublishUsed: Boolean(data.freePublishUsed),
      paidPublishCredits: Number(data.paidPublishCredits ?? 0),
    };
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Organizer social login failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getPublishEligibility = async () => {
  try {
    const response = await apiClient.get('/organizer/publish-eligibility');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load publish eligibility';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const requestPublishCredits = async ({ eventId, eventTitle } = {}) => {
  try {
    const response = await apiClient.post('/organizer/credit-requests', {
      eventId,
      eventTitle,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to request publish credits';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getPaymentConfig = async () => {
  try {
    const response = await apiClient.get('/organizer/payment-config');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load payment info';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const createPaymentRequest = async ({ plan, paymentReference, note }) => {
  try {
    const response = await apiClient.post('/organizer/payment-requests', {
      plan,
      paymentReference,
      note,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to submit payment request';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getMyPaymentRequests = async () => {
  try {
    const response = await apiClient.get('/organizer/payment-requests');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load payment requests';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerStatus = async () => {
  try {
    const response = await apiClient.get('/organizer/status');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to load organizer status';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const checkOrganizerPhoneAvailable = async (phone) => {
  try {
    const response = await apiClient.get('/organizer/verification/check-phone', {
      params: { phone },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Could not verify phone number';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const updateOrganizerContact = async ({ phone, location }) => {
  try {
    const response = await apiClient.patch('/organizer/contact', { phone, location });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to update organizer contact';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerEvents = async (status) => {
  try {
    const params = status ? { status } : {};
    const response = await apiClient.get('/organizer/events', { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to load organizer events';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await apiClient.delete(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to delete event';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const cancelOrganizerEvent = async (eventId) => {
  try {
    const response = await apiClient.post(`/organizer/events/${eventId}/cancel`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to cancel event';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const messageEventAttendees = async (eventId, { title, body }) => {
  try {
    const response = await apiClient.post(`/organizer/events/${eventId}/message-attendees`, {
      title,
      body,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to send message';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const checkInEventAttendee = async (eventId, memberId) => {
  try {
    const response = await apiClient.post(`/organizer/events/${eventId}/check-in`, { memberId });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Check-in failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const notifyEventPostponed = async (eventId, message = '') => {
  try {
    const response = await apiClient.post(`/organizer/events/${eventId}/postpone-notify`, { message });
    return response.data;
  } catch (error) {
    if (error.response) {
      const messageText = extractApiMessage(error) || 'Failed to notify attendees';
      throw new Error(messageText);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const duplicateOrganizerEvent = async (eventId) => {
  try {
    const { data } = await apiClient.get(`/events/${eventId}`);
    const title = `${(data.title || 'Untitled event').trim()} (Copy)`;
    const payload = {
      title,
      description: data.description || '',
      startDatetime: data.startsAt || data.startDatetime,
      endDatetime: data.endsAt || data.endDatetime,
      coverImage: data.image || data.coverImage || null,
      locationName: data.locationName || data.location?.name || 'Venue TBD',
      locationAddress: data.locationAddress || data.location?.address || '',
      locationLatitude: data.location?.latitude ?? data.locationLatitude ?? null,
      locationLongitude: data.location?.longitude ?? data.locationLongitude ?? null,
      capacity: Number(data.capacity) || 0,
      totalPrice: Number(data.price ?? data.totalPrice ?? 0) || 0,
      interestId: Number(data.interestId) || 1,
      isPhysical: data.isOnline !== true,
      isOnline: data.isOnline === true,
      isHybrid: false,
      onlineLink: data.onlineLink || undefined,
      eventFormat: data.eventFormat || null,
      audienceGender: ['all', 'female', 'male'].includes(data.audienceGender) ? data.audienceGender : 'all',
      sponsors: Array.isArray(data.sponsors)
        ? data.sponsors.map((s) => ({ name: s.name, ...(s.logo ? { logo: s.logo } : {}) }))
        : [],
      roster: Array.isArray(data.roster)
        ? data.roster.map((r, idx) => ({
            role: r.role,
            displayName: r.displayName,
            title: r.title || null,
            sortOrder: idx,
            photoUrl: r.photoUrl || null,
          }))
        : [],
    };
    return createOrganizerEvent(payload);
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to duplicate event';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

/** Publish a draft event (same as `publishOrganizerEvent` in `@/api/events`, keeps list cache in sync). */
export const publishEvent = publishOrganizerEvent;

export const getProfileDashboard = async () => {
  try {
    const response = await apiClient.get('/organizer/profile-dashboard');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to load profile dashboard';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

/** Public organizer summary (`GET /organizer/public/:id`). */
export const getPublicOrganizerProfile = async (organizerId) => {
  try {
    const response = await apiClient.get(`/organizer/public/${organizerId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load organizer profile';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

/** Published events for an organizer (`GET /events` with organizer filters). */
export const getPublicOrganizerEvents = async (organizerId, organizerScope) => {
  try {
    return await getEvents({ organizerId, organizerScope, limit: 50, page: 1 });
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load events';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const changeOrganizerPassword = async (currentPassword, newPassword) => {
  try {
    const response = await apiClient.post('/organizer/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to change password';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const followOrganizer = async (organizerId) => {
  try {
    const response = await apiClient.post('/organizer/follow', { organizerId });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to follow organizer';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const unfollowOrganizer = async (organizerId) => {
  try {
    const response = await apiClient.delete(`/organizer/follow/${organizerId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to unfollow organizer';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerFollowers = async () => {
  try {
    const response = await apiClient.get('/organizer/followers');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to load followers';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerAttendees = async ({ page = 1, limit = 20, eventId } = {}) => {
  try {
    const params = { page, limit };
    if (eventId != null) params.eventId = eventId;
    const response = await apiClient.get('/organizer/attendees', { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load attendees';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerAnalytics = async () => {
  try {
    const response = await apiClient.get('/organizer/analytics');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load analytics';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerReport = async (type) => {
  try {
    const response = await apiClient.get(`/organizer/reports/${encodeURIComponent(type)}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Failed to load report';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const createOrganizerReview = async (organizerId, rating, comment) => {
  try {
    const response = await apiClient.post('/organizer/review', { organizerId, rating, comment });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to create review';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const updateOrganizerReview = async (reviewId, rating, comment) => {
  try {
    const body = {};
    if (rating !== undefined) body.rating = rating;
    if (comment !== undefined) body.comment = comment;
    const response = await apiClient.patch(`/organizer/review/${reviewId}`, body);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to update review';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const deleteOrganizerReview = async (reviewId) => {
  try {
    const response = await apiClient.delete(`/organizer/review/${reviewId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to delete review';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerReviews = async (organizerId) => {
  try {
    const response = await apiClient.get(`/organizer/reviews/${organizerId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to load reviews';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getOrganizerTypes = async () => {
  try {
    const response = await apiClient.get('/organizer/types');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to load organizer types');
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getVerificationDocumentTypes = async () => {
  try {
    const response = await apiClient.get('/organizer/verification-document-types');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to load document types');
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

/**
 * Submit the organizer verification wizard.
 * @param {FormData} formData - multipart/form-data with fields + optional `document` file
 */
export const submitOrganizerVerification = async (formData) => {
  try {
    const response = await apiClient.post('/organizer/verification/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Verification submission failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export default {
  organizerRegister,
  organizerLogin,
  organizerSocialLogin,
  getPublishEligibility,
  requestPublishCredits,
  getPaymentConfig,
  createPaymentRequest,
  getMyPaymentRequests,
  getOrganizerStatus,
  checkOrganizerPhoneAvailable,
  updateOrganizerContact,
  getOrganizerEvents,
  deleteEvent,
  cancelOrganizerEvent,
  duplicateOrganizerEvent,
  messageEventAttendees,
  checkInEventAttendee,
  notifyEventPostponed,
  publishEvent,
  getProfileDashboard,
  getPublicOrganizerProfile,
  getPublicOrganizerEvents,
  changeOrganizerPassword,
  followOrganizer,
  unfollowOrganizer,
  getOrganizerFollowers,
  getOrganizerAttendees,
  getOrganizerAnalytics,
  getOrganizerReport,
  createOrganizerReview,
  updateOrganizerReview,
  deleteOrganizerReview,
  getOrganizerReviews,
  getOrganizerTypes,
  getVerificationDocumentTypes,
  submitOrganizerVerification,
};
