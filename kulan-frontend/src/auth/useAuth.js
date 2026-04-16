import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import authStorage from './storage';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../api/client';

export default () => {
  const { user, setUser } = useContext(AuthContext);

  const login = async (authToken) => {
    const user = jwtDecode(authToken);
    setUser(user);
    setAuthToken(authToken); // Immediately set token for subsequent API calls
    await authStorage.storeToken(authToken); // Store token in async storage
  };

  const logout = async () => {
    setUser(null);
    setAuthToken(null); // Clear token from API client
    await authStorage.removeToken();
  };

  return { user, login, logout, setUser };
};
