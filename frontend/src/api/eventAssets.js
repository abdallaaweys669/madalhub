import apiClient, { API_BASE_URL } from './client';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Cover + sponsor image upload.
 *
 * Uses `fetch` (not axios): React Native's networking stack often fails multipart FormData
 * through axios → `Network Error` with no HTTP status even when the tunnel + backend are fine.
 * All other endpoints stay on axios in `client.js`.
 */
export async function uploadEventCoverImage(asset) {
  if (!asset?.uri) {
    throw new Error('Missing image asset');
  }

  const uri = String(asset.uri);
  const name =
    asset.fileName ||
    asset.filename ||
    (typeof uri === 'string' && uri.split('/').pop()?.split('?')[0]) ||
    'upload.jpg';
  const type = asset.mimeType || asset.type || 'image/jpeg';

  const uploadUri = /^(file|content):\/\//i.test(uri) ? uri : `file://${uri}`;

  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  const url = `${base}/events/upload-cover`;

  const headers = {};
  const auth = apiClient.defaults.headers.common.Authorization;
  if (auth) {
    headers.Authorization = typeof auth === 'string' ? auth : String(auth);
  }
  if (base.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

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
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    throw new Error(
      isAbort
        ? `Upload timed out after ${timeoutMs / 1000}s.`
        : isLocal
          ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your LAN IP or ngrok URL, then restart Expo.'
          : `Upload failed: ${err?.message || 'network error'}. Check API URL, backend (:3000), and that phone + server are on the same network (or use ngrok).`,
    );
  }

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      status >= 200 && status < 300
        ? 'Invalid JSON from server'
        : `Upload failed (${status}): ${text.slice(0, 200)}`,
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

  if (!data?.path) {
    throw new Error('Server did not return a file path');
  }

  return data.path;
}
