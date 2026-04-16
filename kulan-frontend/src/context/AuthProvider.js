import React, { useState, useEffect } from 'react';
import AuthContext from './AuthContext';
import authStorage from '../auth/storage';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../api/client';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const restoreUser = async () => {
    const token = await authStorage.getToken();
    if (token) {
      setUser(jwtDecode(token));
      setAuthToken(token);
    }
  };

  useEffect(() => {
    restoreUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
