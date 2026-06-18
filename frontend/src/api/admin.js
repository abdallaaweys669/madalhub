import apiClient from './client';

const getNetworkErrorMessage = (error) => {
  const code = error?.code;
  if (code === 'ECONNABORTED') {
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

export const getPendingOrganizers = async () => {
  try {
    const response = await apiClient.get('/admin/organizers/pending');
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to load pending organizers'));
  }
};

export const approveOrganizer = async (id) => {
  try {
    const response = await apiClient.patch(`/admin/organizers/approve/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to approve organizer'));
  }
};

export const rejectOrganizer = async (id, reason) => {
  try {
    const response = await apiClient.patch(`/admin/organizers/reject/${id}`, { reason });
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to reject organizer'));
  }
};

export const getPendingPaymentRequests = async () => {
  try {
    const response = await apiClient.get('/admin/payment-requests/pending');
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to load pending payments'));
  }
};

export const approvePaymentRequest = async (id) => {
  try {
    const response = await apiClient.patch(`/admin/payment-requests/${id}/approve`);
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to approve payment'));
  }
};

export const rejectPaymentRequest = async (id, adminNote) => {
  try {
    const response = await apiClient.patch(`/admin/payment-requests/${id}/reject`, { adminNote });
    return response.data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Failed to reject payment'));
  }
};

export default {
  getPendingOrganizers,
  approveOrganizer,
  rejectOrganizer,
  getPendingPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
};
