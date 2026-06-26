import AsyncStorage from '@react-native-async-storage/async-storage';

const authTokenKey = 'authToken';
const profileCompletedKey = 'profileCompleted';
const userRoleKey = 'userRole';
const organizerStatusKey = 'organizerStatus';
const rejectionReasonKey = 'rejectionReason';
const guestWelcomeSeenKey = 'guestWelcomeSeen';

const storeToken = async (authToken) => {
  try {
    await AsyncStorage.setItem(authTokenKey, authToken);
  } catch (error) {
    console.log('Error storing the auth token', error);
  }
};

const getToken = async () => {
  try {
    return await AsyncStorage.getItem(authTokenKey);
  } catch (error) {
    console.log('Error getting the auth token', error);
  }
};

const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(authTokenKey);
  } catch (error) {
    console.log('Error removing the auth token', error);
  }
};

const storeProfileCompleted = async (profileCompleted) => {
  try {
    await AsyncStorage.setItem(
      profileCompletedKey,
      profileCompleted ? 'true' : 'false',
    );
  } catch (error) {
    console.log('Error storing profile completion state', error);
  }
};

const getProfileCompleted = async () => {
  try {
    const value = await AsyncStorage.getItem(profileCompletedKey);
    if (value === null) return null;
    return value === 'true';
  } catch (error) {
    console.log('Error getting profile completion state', error);
    return null;
  }
};

const removeProfileCompleted = async () => {
  try {
    await AsyncStorage.removeItem(profileCompletedKey);
  } catch (error) {
    console.log('Error removing profile completion state', error);
  }
};

const storeUserRole = async (role) => {
  try {
    if (role === null || role === undefined) {
      await AsyncStorage.removeItem(userRoleKey);
    } else {
      await AsyncStorage.setItem(userRoleKey, String(role));
    }
  } catch (error) {
    console.log('Error storing user role', error);
  }
};

const getUserRole = async () => {
  try {
    const value = await AsyncStorage.getItem(userRoleKey);
    if (value === null) return null;
    return Number(value);
  } catch (error) {
    console.log('Error getting user role', error);
    return null;
  }
};

const storeOrganizerStatus = async (status) => {
  try {
    if (status === null || status === undefined) {
      await AsyncStorage.removeItem(organizerStatusKey);
    } else {
      await AsyncStorage.setItem(organizerStatusKey, status);
    }
  } catch (error) {
    console.log('Error storing organizer status', error);
  }
};

const getOrganizerStatus = async () => {
  try {
    return await AsyncStorage.getItem(organizerStatusKey);
  } catch (error) {
    console.log('Error getting organizer status', error);
    return null;
  }
};

const storeRejectionReason = async (reason) => {
  try {
    if (reason === null || reason === undefined) {
      await AsyncStorage.removeItem(rejectionReasonKey);
    } else {
      await AsyncStorage.setItem(rejectionReasonKey, reason);
    }
  } catch (error) {
    console.log('Error storing rejection reason', error);
  }
};

const getRejectionReason = async () => {
  try {
    return await AsyncStorage.getItem(rejectionReasonKey);
  } catch (error) {
    console.log('Error getting rejection reason', error);
    return null;
  }
};

const getGuestWelcomeSeen = async () => {
  try {
    return (await AsyncStorage.getItem(guestWelcomeSeenKey)) === 'true';
  } catch (error) {
    console.log('Error getting guest welcome seen state', error);
    return false;
  }
};

const storeGuestWelcomeSeen = async () => {
  try {
    await AsyncStorage.setItem(guestWelcomeSeenKey, 'true');
  } catch (error) {
    console.log('Error storing guest welcome seen state', error);
  }
};

const clearAll = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(authTokenKey),
      AsyncStorage.removeItem(profileCompletedKey),
      AsyncStorage.removeItem(userRoleKey),
      AsyncStorage.removeItem(organizerStatusKey),
      AsyncStorage.removeItem(rejectionReasonKey),
    ]);
  } catch (error) {
    console.log('Error clearing all auth storage', error);
  }
};

export default {
  storeToken,
  getToken,
  removeToken,
  storeProfileCompleted,
  getProfileCompleted,
  removeProfileCompleted,
  storeUserRole,
  getUserRole,
  storeOrganizerStatus,
  getOrganizerStatus,
  storeRejectionReason,
  getRejectionReason,
  getGuestWelcomeSeen,
  storeGuestWelcomeSeen,
  clearAll,
};
