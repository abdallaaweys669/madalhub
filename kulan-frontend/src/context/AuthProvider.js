import React, { useState, useEffect } from 'react';
import AuthContext from './AuthContext';
import authStorage from '../auth/storage';
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [organizerStatus, setOrganizerStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);

  const restoreUser = async () => {
    const token = await authStorage.getToken();
    const storedProfileCompleted = await authStorage.getProfileCompleted();
    const storedRole = await authStorage.getUserRole();
    const storedOrgStatus = await authStorage.getOrganizerStatus();
    const storedRejectionReason = await authStorage.getRejectionReason();

    if (!token) {
      setUser(null);
      setAuthToken(null);
      setProfileCompleted(null);
      setUserRole(null);
      setOrganizerStatus(null);
      setRejectionReason(null);
      setIsHydrated(true);
      return;
    }

    try {
      setAuthToken(token);
      const decodedUser = jwtDecode(token);
      let normalizedUser = normalizeUser(decodedUser);
      const role = decodedUser?.role ?? storedRole;
      setUserRole(role);

      try {
        const profile = await authApi.getMe();
        normalizedUser = normalizeUser(decodedUser, profile);
        if (role === ROLE_ORGANIZER) {
          setOrganizerStatus(profile.organizerStatus ?? 'pending');
          setRejectionReason(profile.rejectionReason ?? null);
        }
      } catch (error) {
        console.log('Unable to fetch profile during hydration, using token user.', error?.message);
        if (role === ROLE_ORGANIZER) {
          setOrganizerStatus(storedOrgStatus ?? 'pending');
          setRejectionReason(storedRejectionReason);
        }
      }
      setUser(normalizedUser);
      setProfileCompleted(storedProfileCompleted);
    } catch (error) {
      console.log('Error restoring user from token', error);
      setUser(null);
      setAuthToken(null);
      setProfileCompleted(null);
      setUserRole(null);
      setOrganizerStatus(null);
      setRejectionReason(null);
      await authStorage.removeToken();
      await authStorage.removeProfileCompleted();
    } finally {
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    restoreUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        profileCompleted,
        setProfileCompleted,
        isLoggedIn: Boolean(user),
        isHydrated,
        userRole,
        setUserRole,
        organizerStatus,
        setOrganizerStatus,
        rejectionReason,
        setRejectionReason,
        isOrganizer: userRole === ROLE_ORGANIZER,
        isMember: userRole === ROLE_MEMBER,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
