import apiClient, { API_BASE_URL } from './client';

export const getInterests = async () => {
  try {
    console.log('Fetching interests...');
    const url = '/interests';
    const response = await apiClient.get(url);
    console.log('Response:', response.data);
    if (!response.data?.interests?.length) {
      console.log('No interests found');
    }
    return response.data?.interests || [];
  } catch (error) {
    console.log('ERROR:', error.message);
    console.log('FULL ERROR:', error.response || error);

    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch interests');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export const updateProfile = async (data) => {
  try {
    const payload = {
      location: data.location,
      gender: data.gender,
      dob: data.dob,
    };
    const response = await apiClient.patch('/onboarding/profile', payload);
    return response.data;
  } catch (error) {
    console.log('ERROR:', error.message);
    console.log('FULL ERROR:', error.response || error);

    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to update profile');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

/** Logged-in member's selected interests (from `member_interests`). */
export const getMyInterests = async () => {
  try {
    const response = await apiClient.get('/onboarding/my-interests');
    return Array.isArray(response.data?.interests) ? response.data.interests : [];
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to load your interests');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export const updateInterests = async (interestIds) => {
  try {
    const response = await apiClient.post('/onboarding/interests', { interestIds });
    return response.data;
  } catch (error) {
    console.log('ERROR:', error.message);
    console.log('FULL ERROR:', error.response || error);

    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to update interests');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export const updateOrganizerProfile = async (data) => {
  try {
    const payload = {
      organization_name: data.organization_name,
      organization_description: data.organization_description,
      website: data.website,
    };
    const response = await apiClient.patch('/onboarding/organizer', payload);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to update organizer profile');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export const uploadOrganizerDocument = async (formData) => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const url = `${base}/onboarding/organizer/document`;
  const headers = {};
  const auth = apiClient.defaults.headers.common.Authorization;
  if (auth) headers.Authorization = typeof auth === 'string' ? auth : String(auth);
  if (base.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

  const controller = new AbortController();
  const timeoutMs = 120000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    const isLocal = /localhost|127\.0\.0\.1/i.test(base);
    throw new Error(
      isAbort
        ? `Document upload timed out after ${timeoutMs / 1000}s.`
        : isLocal
          ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your ngrok URL and restart Expo.'
          : `Document upload failed: ${error?.message || 'network'}. Check ngrok and backend.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(res.ok ? 'Invalid JSON from server' : `Document upload failed (${res.status})`);
  }

  if (!res.ok) {
    const serverMsg =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      `HTTP ${res.status}`;
    throw new Error(serverMsg);
  }

  return data;
};

export const uploadOrganizerProfileImage = async (formData) => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const url = `${base}/onboarding/organizer/profile-image`;
  const headers = {};
  const auth = apiClient.defaults.headers.common.Authorization;
  if (auth) headers.Authorization = typeof auth === 'string' ? auth : String(auth);
  if (base.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

  const controller = new AbortController();
  const timeoutMs = 120000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    const isLocal = /localhost|127\.0\.0\.1/i.test(base);
    throw new Error(
      isAbort
        ? `Upload timed out after ${timeoutMs / 1000}s.`
        : isLocal
          ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your ngrok URL and restart Expo.'
          : `Upload failed: ${error?.message || 'network'}. Check ngrok and backend.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(res.ok ? 'Invalid JSON from server' : `Upload failed (${res.status})`);
  }

  if (!res.ok) {
    const serverMsg =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      `HTTP ${res.status}`;
    throw new Error(serverMsg);
  }

  return data;
};

export const uploadMemberProfileImage = async (formData) => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const url = `${base}/onboarding/member/profile-image`;
  const headers = {};
  const auth = apiClient.defaults.headers.common.Authorization;
  if (auth) headers.Authorization = typeof auth === 'string' ? auth : String(auth);
  if (base.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

  const controller = new AbortController();
  const timeoutMs = 120000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    const isLocal = /localhost|127\.0\.0\.1/i.test(base);
    throw new Error(
      isAbort
        ? `Upload timed out after ${timeoutMs / 1000}s.`
        : isLocal
          ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your ngrok URL and restart Expo.'
          : `Upload failed: ${error?.message || 'network'}. Check ngrok and backend.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(res.ok ? 'Invalid JSON from server' : `Upload failed (${res.status})`);
  }

  if (!res.ok) {
    const serverMsg =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      `HTTP ${res.status}`;
    throw new Error(serverMsg);
  }

  return data;
};

export default {
  getInterests,
  getMyInterests,
  updateProfile,
  updateInterests,
  updateOrganizerProfile,
  uploadOrganizerDocument,
  uploadOrganizerProfileImage,
  uploadMemberProfileImage,
};