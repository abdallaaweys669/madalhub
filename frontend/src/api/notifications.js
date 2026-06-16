import apiClient from './client';

export async function getNotifications() {
  const response = await apiClient.get('/notifications');
  return response.data;
}

export async function getNotificationUnreadCount() {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data;
}

export async function markNotificationRead(id) {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
}
