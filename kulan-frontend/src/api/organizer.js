import apiClient from './client';
import { publishOrganizerEvent } from './events';

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
      organizerStatus: data.organizerStatus || 'pending',
      rejectionReason: data.rejectionReason || null,
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
      organizerStatus: data.organizerStatus || 'pending',
      rejectionReason: data.rejectionReason || null,
    };
  } catch (error) {
    if (error.response) {
      const message = extractApiMessage(error) || 'Organizer social login failed';
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

export default {
  organizerRegister,
  organizerLogin,
  organizerSocialLogin,
  getOrganizerStatus,
  updateOrganizerContact,
  getOrganizerEvents,
  deleteEvent,
  publishEvent,
  getProfileDashboard,
  changeOrganizerPassword,
  followOrganizer,
  unfollowOrganizer,
  getOrganizerFollowers,
  createOrganizerReview,
  updateOrganizerReview,
  deleteOrganizerReview,
  getOrganizerReviews,
};
