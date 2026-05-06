import apiClient, { API_BASE_URL } from './client';

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

  const uri = asset.uri;
  const name =
    asset.fileName ||
    asset.filename ||
    (typeof uri === 'string' && uri.split('/').pop()?.split('?')[0]) ||
    'upload.jpg';
  const type = asset.mimeType || asset.type || 'image/jpeg';

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: name.includes('.') ? name : `${name}.jpg`,
    type,
  });

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
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    const isLocal = /localhost|127\.0\.0\.1/i.test(base);
    throw new Error(
      isAbort
        ? `Upload timed out after ${timeoutMs / 1000}s.`
        : isLocal
          ? 'Cannot reach API (localhost on device). Set EXPO_PUBLIC_API_BASE_URL to your ngrok URL and restart Expo.'
          : `Upload failed: ${err?.message || 'network'}. Check ngrok, Nest on :3000, and Wi‑Fi.`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      res.ok ? 'Invalid JSON from server' : `Upload failed (${res.status}): ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    const serverMsg =
      (typeof data?.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      text?.slice(0, 200) ||
      `HTTP ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new Error('Sign in again as an organizer — upload needs a valid session.');
    }
    throw new Error(serverMsg);
  }

  if (!data?.path) {
    throw new Error('Server did not return a file path');
  }

  return data.path;
}
