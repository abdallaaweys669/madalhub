import apiClient from './client';

/**
 * @param {{ full_name?: string; email?: string; phone?: string; location?: string; password?: string; profile_show_email?: boolean; profile_show_phone?: boolean; profile_hidden?: boolean }} payload
 */
export async function updateMemberMe(payload) {
  const response = await apiClient.patch('/member/me', payload);
  return response.data;
}

export async function getMemberById(id) {
  const response = await apiClient.get(`/member/${id}`);
  return response.data;
}
