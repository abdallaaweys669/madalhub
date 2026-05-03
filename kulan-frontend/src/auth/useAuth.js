import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import authStorage from './storage';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../api/client';
import authApi from '../api/auth';

const ROLE_MEMBER = 1;
const ROLE_ORGANIZER = 2;

const normalizeUser = (decodedUser, profile = null) => {
  const resolvedFullName =
    profile?.full_name ||
    profile?.fullName ||
    profile?.name ||
    decodedUser?.fullName ||
    decodedUser?.full_name ||
    decodedUser?.name ||
    decodedUser?.firstName ||
    '';
  const resolvedLocation =
    profile?.location ||
    profile?.city ||
    profile?.address ||
    decodedUser?.location ||
    decodedUser?.city ||
    '';
  const resolvedProfileImg =
    profile?.profileImg ||
    profile?.profile_img ||
    decodedUser?.profileImg ||
    decodedUser?.profile_img ||
    null;

  return {
    ...decodedUser,
    ...(profile || {}),
    fullName: resolvedFullName,
    location: resolvedLocation,
    profileImg: resolvedProfileImg,
    avatarUrl: resolvedProfileImg,
  };
};

export default () => {
  const {
    user,
    setUser,
    profileCompleted,
    setProfileCompleted,
    isLoggedIn,
    isHydrated,
    userRole,
    setUserRole,
    organizerStatus,
    setOrganizerStatus,
    rejectionReason,
    setRejectionReason,
    isOrganizer,
    isMember,
  } = useContext(AuthContext);

  const login = async (authToken, completed = null) => {
    const decodedUser = jwtDecode(authToken);
    const role = decodedUser?.role;
    setAuthToken(authToken);
    await authStorage.storeToken(authToken);
    await authStorage.storeUserRole(role);
    setUserRole(role);

    let normalizedUser = normalizeUser(decodedUser);
    try {
      const profile = await authApi.getMe();
      normalizedUser = normalizeUser(decodedUser, profile);
      if (role === ROLE_ORGANIZER) {
        const orgStatus = profile.organizerStatus ?? 'pending';
        const orgReason = profile.rejectionReason ?? null;
        setOrganizerStatus(orgStatus);
        setRejectionReason(orgReason);
        await authStorage.storeOrganizerStatus(orgStatus);
        await authStorage.storeRejectionReason(orgReason);
      }
    } catch (error) {
      console.log('Unable to fetch profile during login, using token user.', error?.message);
    }

    setUser(normalizedUser);

    if (completed !== null && completed !== undefined) {
      setProfileCompleted(Boolean(completed));
      await authStorage.storeProfileCompleted(Boolean(completed));
    }
  };

  const loginAsOrganizer = async (authToken, orgStatus, orgReason = null) => {
    const decodedUser = jwtDecode(authToken);
    setAuthToken(authToken);
    await authStorage.storeToken(authToken);
    await authStorage.storeUserRole(ROLE_ORGANIZER);
    setUserRole(ROLE_ORGANIZER);
    setOrganizerStatus(orgStatus);
    setRejectionReason(orgReason);
    await authStorage.storeOrganizerStatus(orgStatus);
    await authStorage.storeRejectionReason(orgReason);

    let normalizedUser = normalizeUser(decodedUser);
    try {
      const profile = await authApi.getMe();
      normalizedUser = normalizeUser(decodedUser, profile);
    } catch (error) {
      console.log('Unable to fetch profile during organizer login, using token user.', error?.message);
    }

    setUser(normalizedUser);
  };

  const logout = async () => {
    setUser(null);
    setProfileCompleted(null);
    setUserRole(null);
    setOrganizerStatus(null);
    setRejectionReason(null);
    setAuthToken(null);
    await authStorage.clearAll();
  };

  const completeOnboarding = async () => {
    setProfileCompleted(true);
    await authStorage.storeProfileCompleted(true);
  };

  return {
    user,
    login,
    loginAsOrganizer,
    logout,
    setUser,
    profileCompleted,
    setProfileCompleted,
    completeOnboarding,
    isLoggedIn,
    isHydrated,
    userRole,
    organizerStatus,
    setOrganizerStatus,
    rejectionReason,
    setRejectionReason,
    isOrganizer,
    isMember,
  };
};
