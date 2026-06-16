import apiClient from './client';

/**
 * @param {{ full_name?: string; email?: string; phone?: string; location?: string; password?: string; profile_show_email?: boolean; profile_show_phone?: boolean; profile_hidden?: boolean; social_website?: string; social_linkedin?: string; social_instagram?: string; social_facebook?: string; social_tiktok?: string }} payload
 */
export async function updateMemberMe(payload) {
  const response = await apiClient.patch('/member/me', payload);
  return response.data;
}

export async function getMemberById(id) {
  const response = await apiClient.get(`/member/${id}`);
  return response.data;
}

export async function getMemberInterestsById(id) {
  const response = await apiClient.get(`/member/${id}/interests`);
  return response.data;
}

export async function getMemberJoinedEventsById(id) {
  const response = await apiClient.get(`/member/${id}/joined-events`);
  return response.data;
}

export async function getMemberSavedEventsById(id) {
  const response = await apiClient.get(`/member/${id}/saved-events`);
  return response.data;
}
