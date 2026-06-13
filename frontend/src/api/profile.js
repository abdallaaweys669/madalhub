import apiClient from './client';

const getMemberProfile = () => apiClient.get('/profile/member');

const getMemberInterests = () => apiClient.get('/profile/member/interests');

export default {
  getMemberProfile,
  getMemberInterests,
};
