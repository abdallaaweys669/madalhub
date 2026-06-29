import * as ImagePicker from 'expo-image-picker';

const MAX_BYTES = 10 * 1024 * 1024;

function guessFileName(uri, mimeType) {
  const fromUri = String(uri ?? '')
    .split('/')
    .pop()
    ?.split('?')[0];
  if (fromUri) return fromUri;
  if (mimeType === 'image/png') return 'document.png';
  return 'document.jpg';
}

/**
 * Pick a verification proof image from the photo library.
 * (PDF picker requires a native rebuild with expo-document-picker linked.)
 */
export async function pickVerificationDocument() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Photo library permission is required to upload proof.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.92,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) {
    return { asset: null };
  }

  const asset = result.assets[0];
  const size = asset.fileSize ?? null;

  if (size && size > MAX_BYTES) {
    return { error: 'too_large' };
  }

  return {
    asset: {
      uri: asset.uri,
      name: asset.fileName || guessFileName(asset.uri, asset.mimeType),
      mimeType: asset.mimeType || 'image/jpeg',
      size,
    },
  };
}
