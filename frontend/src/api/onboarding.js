import apiClient, { API_BASE_URL } from './client';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export const getInterests = async () => {
  try {
    const response = await apiClient.get('/interests');
    return response.data?.interests || [];
  } catch (error) {
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

function parseUploadResponse(status, text) {
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      status >= 200 && status < 300
        ? 'Invalid JSON from server'
        : `Document upload failed (${status}): ${text.slice(0, 200)}`,
    );
  }

  if (status < 200 || status >= 300) {
    const serverMsg =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      text?.slice(0, 200) ||
      `HTTP ${status}`;
    if (status === 401 || status === 403) {
      throw new Error('Sign in again as an organizer — upload needs a valid session.');
    }
    throw new Error(serverMsg);
  }

  return data;
}

export const uploadOrganizerDocument = async (asset, documentType) => {
  if (!asset?.uri) {
    throw new Error('Missing document file');
  }
  const normalizedType = String(documentType || '').trim();
  if (!normalizedType) {
    throw new Error('Document type is required');
  }

  const uri = String(asset.uri);
  const name =
    asset.fileName ||
    asset.filename ||
    (typeof uri === 'string' && uri.split('/').pop()?.split('?')[0]) ||
    'document.jpg';
  const type = asset.mimeType || asset.type || 'image/jpeg';
  const uploadUri = /^(file|content):\/\//i.test(uri) ? uri : `file://${uri}`;

  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const url = `${base}/onboarding/organizer/document`;
  const headers = {};
  const auth = apiClient.defaults.headers.common.Authorization;
  if (auth) headers.Authorization = typeof auth === 'string' ? auth : String(auth);
  if (base.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

  const timeoutMs = 120000;
  const isLocal = /localhost|127\.0\.0\.1/i.test(base);

  let status = 0;
  let text = '';
  try {
    if (Platform.OS !== 'web') {
      const multipartUploadType =
        FileSystem?.FileSystemUploadType?.MULTIPART ??
        FileSystem?.FileSystemUploadType?.multipart ??
        1;
      const result = await FileSystem.uploadAsync(url, uploadUri, {
        httpMethod: 'POST',
        uploadType: multipartUploadType,
        fieldName: 'file',
        mimeType: type,
        headers,
        parameters: {
          document_type: normalizedType,
        },
      });
      status = result.status;
      text = result.body || '';
    } else {
      const formData = new FormData();
      formData.append('file', {
        uri: uploadUri,
        name: name.includes('.') ? name : `${name}.jpg`,
        type,
      });
      formData.append('document_type', normalizedType);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        });
        status = res.status;
        text = await res.text();
      } finally {
        clearTimeout(timeoutId);
      }
    }
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    throw new Error(
      isAbort
        ? `Document upload timed out after ${timeoutMs / 1000}s.`
        : isLocal
          ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your ngrok URL and restart Expo.'
          : `Document upload failed: ${error?.message || 'network'}. Check ngrok and backend.`,
    );
  }

  return parseUploadResponse(status, text);
};

export const uploadOrganizerProfileImage = async (asset) => {
  if (!asset?.uri) {
    throw new Error('Missing profile image');
  }

  const uri = String(asset.uri);
  const name =
    asset.fileName ||
    asset.filename ||
    (typeof uri === 'string' && uri.split('/').pop()?.split('?')[0]) ||
    `organizer-profile-${Date.now()}.jpg`;
  const type = asset.mimeType || asset.type || 'image/jpeg';
  const uploadUri = /^(file|content):\/\//i.test(uri) ? uri : `file://${uri}`;

  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const url = `${base}/onboarding/organizer/profile-image`;
  const headers = {};
  const auth = apiClient.defaults.headers.common.Authorization;
  if (auth) headers.Authorization = typeof auth === 'string' ? auth : String(auth);
  if (base.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

  const timeoutMs = 120000;
  const isLocal = /localhost|127\.0\.0\.1/i.test(base);

  let status = 0;
  let text = '';
  try {
    if (Platform.OS !== 'web') {
      const multipartUploadType =
        FileSystem?.FileSystemUploadType?.MULTIPART ??
        FileSystem?.FileSystemUploadType?.multipart ??
        1;
      const result = await FileSystem.uploadAsync(url, uploadUri, {
        httpMethod: 'POST',
        uploadType: multipartUploadType,
        fieldName: 'file',
        mimeType: type,
        headers,
      });
      status = result.status;
      text = result.body || '';
    } else {
      const formData = new FormData();
      formData.append('file', {
        uri: uploadUri,
        name: name.includes('.') ? name : `${name}.jpg`,
        type,
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        });
        status = res.status;
        text = await res.text();
      } finally {
        clearTimeout(timeoutId);
      }
    }
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    throw new Error(
      isAbort
        ? `Upload timed out after ${timeoutMs / 1000}s.`
        : isLocal
          ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your LAN IP or ngrok URL and restart Expo.'
          : `Upload failed: ${error?.message || 'network'}. Check API URL and network.`,
    );
  }

  return parseUploadResponse(status, text);
};

export const uploadMemberProfileImage = async (formData) => {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const headers = {};
  if (base.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';

  try {
    const response = await apiClient.post('/onboarding/member/profile-image', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data,
      timeout: 120000,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to upload member profile image');
    }
    const isLocal = /localhost|127\.0\.0\.1/i.test(base);
    throw new Error(
      isLocal
        ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your LAN/ngrok URL and restart Expo.'
        : `Upload failed: ${error?.message || 'network'}. Check API server and network.`,
    );
  }
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