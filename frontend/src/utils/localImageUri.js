import * as FileSystem from 'expo-file-system/legacy';

import { API_BASE_URL } from '@/api/client';

function withFileScheme(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;
  if (/^(file|content|https?):\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `file://${trimmed}`;
  return trimmed;
}

/**
 * Instant in-app preview from an ImagePicker asset (base64 is most reliable on Android).
 */
export function buildPickerPreviewUri(asset) {
  if (!asset) return null;

  const mime = asset.mimeType || asset.type || 'image/jpeg';
  if (typeof asset.base64 === 'string' && asset.base64.length > 0) {
    return `data:${mime};base64,${asset.base64}`;
  }

  const uri = typeof asset.uri === 'string' ? asset.uri.trim() : '';
  return uri || null;
}

/**
 * Copy content:// (and other non-file) picks into app cache so React Native Image can render them.
 */
export async function normalizeLocalImageUri(uri) {
  const trimmed = typeof uri === 'string' ? uri.trim() : '';
  if (!trimmed) return null;

  if (/^data:/i.test(trimmed)) return trimmed;
  if (/^file:\/\//i.test(trimmed)) return trimmed;

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return withFileScheme(trimmed);

  const lower = trimmed.toLowerCase();
  const extension = lower.includes('.png') ? 'png' : 'jpg';
  const dest = `${cacheDir}picked-image-${Date.now()}.${extension}`;

  try {
    await FileSystem.copyAsync({ from: trimmed, to: dest });
    return withFileScheme(dest) || dest;
  } catch (error) {
    console.warn('[normalizeLocalImageUri]', error?.message || error);
    return withFileScheme(trimmed);
  }
}

/**
 * Download http(s) assets locally for display (needed for ngrok + React Native Image).
 */
export async function cacheRemoteImageForDisplay(url) {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (!trimmed) return null;
  if (/^(data:|file:)/i.test(trimmed)) return trimmed;

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return trimmed;

  const dest = `${cacheDir}remote-image-${Date.now()}.jpg`;
  const headers = {};
  const base = String(API_BASE_URL || '');
  if (trimmed.includes('ngrok') || base.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  const result = await FileSystem.downloadAsync(trimmed, dest, { headers });
  return withFileScheme(result?.uri || dest) || result?.uri || dest;
}
