import apiClient from './client';

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
  try {
    const response = await apiClient.post('/onboarding/organizer/document', formData, {
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      transformRequest: (body, headers) => {
        if (headers && typeof headers.delete === 'function') {
          headers.delete('Content-Type');
        } else if (headers) {
          delete headers['Content-Type'];
        }
        return body;
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to upload document');
    }
    throw new Error('Network error. Please check your connection.');
  }
};

export default {
  getInterests,
  updateProfile,
  updateInterests,
  updateOrganizerProfile,
  uploadOrganizerDocument,
};