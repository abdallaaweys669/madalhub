import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import authStorage from './storage';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../api/client';
import authApi from '../api/auth';
import { normalizeUser } from './normalizeUser';
import { hydrateOrganizerApprovedScreen } from '../navigation/organizerGate';

const ROLE_MEMBER = 1;
const ROLE_ORGANIZER = 2;
const ROLE_ADMIN = 3;

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

    // Let navigation continue quickly; enrich profile in background.
    setUser(normalizeUser(decodedUser));

    if (completed !== null && completed !== undefined) {
      setProfileCompleted(Boolean(completed));
      await authStorage.storeProfileCompleted(Boolean(completed));
    }

    void (async () => {
      try {
        const profile = await authApi.getMe();
        setUser(normalizeUser(decodedUser, profile));
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
    })();
  };

  const loginAsOrganizer = async (authToken, orgStatus, orgReason = null) => {
    const decodedUser = jwtDecode(authToken);
    const userId = decodedUser?.id ?? decodedUser?.sub;
    setAuthToken(authToken);
    await authStorage.storeToken(authToken);
    await authStorage.storeUserRole(ROLE_ORGANIZER);
    setUserRole(ROLE_ORGANIZER);
    setOrganizerStatus(orgStatus);
    setRejectionReason(orgReason);
    await authStorage.storeOrganizerStatus(orgStatus);
    await authStorage.storeRejectionReason(orgReason);

    if (userId != null) {
      await hydrateOrganizerApprovedScreen(userId);
    }

    setUser(normalizeUser(decodedUser));

    void (async () => {
      try {
        const profile = await authApi.getMe();
        setUser(normalizeUser(decodedUser, profile));
      } catch (error) {
        console.log('Unable to fetch profile during organizer login, using token user.', error?.message);
      }
    })();
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
    isAdmin: userRole === ROLE_ADMIN,
  };
};
