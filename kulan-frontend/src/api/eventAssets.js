import apiClient from './client';

/**
 * Upload an image for event cover or sponsor logo (organizer-only).
 * Returns server path like `/uploads/event-123.jpg` — store on event `coverImage` or sponsor `logo`.
 */
export async function uploadEventCoverImage(asset) {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || 'upload.jpg',
    type: asset.mimeType || 'image/jpeg',
  });
  const { data } = await apiClient.post('/events/upload-cover', formData);
  return data.path;
}
