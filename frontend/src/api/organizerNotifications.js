import apiClient from './client';

const getNetworkErrorMessage = (error) => {
  if (error?.code === 'ECONNABORTED') {
    return 'Connection timed out. Make sure your backend is running and try again.';
  }
  return 'Network error. Check your internet connection and API URL.';
};

const extractMessage = (error, fallback) => {
  if (error.response) {
    return error.response.data?.message || fallback;
  }
  return getNetworkErrorMessage(error);
};

export async function getOrganizerNotifications() {
  try {
    const response = await apiClient.get('/organizer/notifications');
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to load notifications'));
  }
}

export async function getOrganizerNotificationUnreadCount() {
  try {
    const response = await apiClient.get('/organizer/notifications/unread-count');
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to load notification count'));
  }
}

export async function markOrganizerNotificationRead(id) {
  try {
    const response = await apiClient.patch(`/organizer/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to mark notification read'));
  }
}

export async function markAllOrganizerNotificationsRead() {
  try {
    const response = await apiClient.patch('/organizer/notifications/read-all');
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to mark all notifications read'));
  }
}

export default {
  getOrganizerNotifications,
  getOrganizerNotificationUnreadCount,
  markOrganizerNotificationRead,
  markAllOrganizerNotificationsRead,
};
