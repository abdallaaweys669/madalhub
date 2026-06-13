import apiClient from './client';

const getNetworkErrorMessage = (error) => {
  const code = error?.code;
  if (code === 'ECONNABORTED') {
    return 'Connection timed out. Make sure your backend tunnel is running and try again.';
  }
  return 'Network error. Check your internet connection and API tunnel URL.';
};

export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    const data = response.data;
    const token = data.access_token;

    return {
      token,
      onboardingCompleted: data.profileCompleted,
    };
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Login failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const register = async (userInfo) => {
  try {
    await apiClient.post('/member/register', userInfo);
    const loginCredentials = {
      email: userInfo.email,
      password: userInfo.password,
    };
    return login(loginCredentials);
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      if (Array.isArray(data?.errors)) {
        throw { fieldErrors: data.errors };
      }
      if (data?.message) {
        throw new Error(data.message);
      }
      throw new Error(data || 'Registration failed');
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const getMe = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Failed to load user profile';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export default {
  register,
  login,
  getMe,
};