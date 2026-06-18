import apiClient from './client';

const getNetworkErrorMessage = (error) => {
  const code = error?.code;
  if (code === 'ECONNABORTED') {
    return 'Connection timed out. Make sure your backend tunnel is running and try again.';
  }
  return 'Network error. Check your internet connection and API tunnel URL.';
};

const mapTokenResponse = (data) => ({
  token: data.access_token,
  onboardingCompleted: data.profileCompleted,
});

export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return mapTokenResponse(response.data);
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Login failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const sendOtp = async ({ email, purpose }) => {
  try {
    const response = await apiClient.post('/auth/otp/send', { email, purpose });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Could not send verification code';
      const err = new Error(message);
      err.response = error.response;
      throw err;
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const verifyOtpLogin = async ({ email, code }) => {
  try {
    const response = await apiClient.post('/auth/otp/verify', {
      email,
      code,
      purpose: 'login',
    });
    return mapTokenResponse(response.data);
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Verification failed';
      const err = new Error(message);
      err.response = error.response;
      throw err;
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const verifyOtpSignup = async (payload) => {
  try {
    const response = await apiClient.post('/auth/otp/verify-signup', payload);
    return mapTokenResponse(response.data);
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      if (Array.isArray(data?.errors)) {
        throw { fieldErrors: data.errors };
      }
      const message = data?.message || 'Verification failed';
      const err = new Error(message);
      err.response = error.response;
      throw err;
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

export const clerkExchange = async ({ token, role = 'member', fullName, password }) => {
  try {
    const response = await apiClient.post('/auth/clerk-exchange', {
      token,
      role,
      ...(fullName && { fullName }),
      ...(password && { password }),
    });
    return mapTokenResponse(response.data);
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.message || 'Authentication failed';
      throw new Error(message);
    }
    throw new Error(getNetworkErrorMessage(error));
  }
};

/** @deprecated Prefer verifyOtpSignup after email verification step */
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
  sendOtp,
  verifyOtpLogin,
  verifyOtpSignup,
  clerkExchange,
  getMe,
};
