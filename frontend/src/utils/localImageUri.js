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
 * Prefer a cached file:// URI for cover previews (large data: URIs often fail in Image on Android).
 */
export async function prepareCoverPreviewFromPicker(asset) {
  if (!asset) return null;

  const rawUri = typeof asset.uri === 'string' ? asset.uri.trim() : '';
  if (/^file:\/\//i.test(rawUri)) return rawUri;

  if (rawUri) {
    const copied = await normalizeLocalImageUri(rawUri);
    if (copied) return copied;
  }

  const mime = asset.mimeType || asset.type || 'image/jpeg';
  if (typeof asset.base64 === 'string' && asset.base64.length > 0 && asset.base64.length < 600_000) {
    return `data:${mime};base64,${asset.base64}`;
  }

  return rawUri || null;
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
  if (trimmed.startsWith('/')) return `file://${trimmed}`;

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return withFileScheme(trimmed);

  const lower = trimmed.toLowerCase();
  const extension = lower.includes('.png') ? 'png' : 'jpg';
  const dest = `${cacheDir}event-cover-${Date.now()}.${extension}`;

  try {
    await FileSystem.copyAsync({ from: trimmed, to: dest });
    return dest.startsWith('file://') ? dest : `file://${dest}`;
  } catch (copyError) {
    try {
      const base64 = await FileSystem.readAsStringAsync(trimmed, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(dest, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return dest.startsWith('file://') ? dest : `file://${dest}`;
    } catch (readError) {
      console.warn('[normalizeLocalImageUri]', copyError?.message || readError?.message || copyError);
      return withFileScheme(trimmed);
    }
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
