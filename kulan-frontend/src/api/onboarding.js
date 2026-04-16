import apiClient from './client';

const getInterests = () => apiClient.get('/interests');
const updateProfile = (data) => apiClient.patch('/profile/member', data);
const updateInterests = (interestIds) => apiClient.post('/profile/member/interests', { interestIds });

export default {
  getInterests,
  updateProfile,
  updateInterests,
};
