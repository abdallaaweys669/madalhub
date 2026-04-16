import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://192.168.100.60:5000/api',
});

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
