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

export default {
  organizerRegister,
  organizerLogin,
  getOrganizerStatus,
  getOrganizerEvents,
  deleteEvent,
  publishEvent,
};
