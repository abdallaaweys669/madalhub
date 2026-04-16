import apiClient from './client';

const register = (userInfo) => apiClient.post('/auth/register-member', userInfo);

const login = (credentials) => apiClient.post('/auth/login', credentials);

export default {
  register,
  login,
};
