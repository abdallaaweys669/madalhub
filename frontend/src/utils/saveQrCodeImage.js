import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

/** True when running inside the Expo Go app (not a dev/production build). */
export function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function ensurePhotoLibraryPermission() {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (permission.status !== 'granted' && permission.status !== 'limited') {
    Alert.alert(
      'Permission needed',
      'Allow photo library access to save images.',
    );
    return false;
  }
  return true;
}

async function shareImageFallback(fileUri) {
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: 'Save ticket',
  });
  return true;
}

/**
 * Save a local PNG file to the gallery, or open the share sheet when direct save
 * is unavailable (Expo Go on Android, denied permission, etc.).
 * @returns {Promise<'saved' | 'shared' | false>}
 */
export async function saveImageFileToPhotos(fileUri) {
  if (!fileUri || typeof fileUri !== 'string') {
    throw new Error('Missing image file');
  }

  // Expo Go cannot write to the gallery on Android (Google permission policy).
  if (isExpoGo()) {
    const shared = await shareImageFallback(fileUri);
    return shared ? 'shared' : false;
  }

  try {
    const allowed = await ensurePhotoLibraryPermission();
    if (!allowed) {
      const shared = await shareImageFallback(fileUri);
      return shared ? 'shared' : false;
    }

    await MediaLibrary.saveToLibraryAsync(fileUri);
    return 'saved';
  } catch {
    const shared = await shareImageFallback(fileUri);
    return shared ? 'shared' : false;
  }
}

/**
 * Persist a PNG data URL to the device photo library.
 * @returns {Promise<'saved' | 'shared' | false>}
 */
export async function saveQrCodeImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Missing QR image data');
  }

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const fileUri = `${FileSystem.cacheDirectory}kulan-ticket-qr-${Date.now()}.png`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return saveImageFileToPhotos(fileUri);
}

export function imageSaveAlertTitle(result) {
  if (result === 'saved') return 'Saved';
  if (result === 'shared') return isExpoGo() ? 'Save to gallery' : 'Saved';
  return null;
}

export function imageSaveAlertMessage(result, kind = 'qr') {
  const label = kind === 'ticket' ? 'Ticket' : 'QR code';

  if (result === 'saved') {
    return `${label} saved to your photos.`;
  }

  if (result === 'shared') {
    if (isExpoGo()) {
      if (Platform.OS === 'android') {
        return `Expo Go cannot save directly to your gallery. Use Save image or Photos in the share menu to save your ${label.toLowerCase()}.`;
      }
      return `Use Save Image in the share menu to add the ${label.toLowerCase()} to your photos.`;
    }
    return 'Choose Save image from the share menu.';
  }

  return null;
}

export function exportQrDataUrl(qrRef) {
  return new Promise((resolve, reject) => {
    const svg = qrRef?.current;
    if (!svg?.toDataURL) {
      reject(new Error('QR not ready'));
      return;
    }
    svg.toDataURL((dataUrl) => {
      if (!dataUrl) {
        reject(new Error('QR export failed'));
        return;
      }
      resolve(dataUrl);
    });
  });
}

/** Export QR from a mounted `react-native-qrcode-svg` ref and save to photos. */
export async function downloadQrFromRef(qrRef) {
  const dataUrl = await exportQrDataUrl(qrRef);
  return saveQrCodeImage(dataUrl);
}
