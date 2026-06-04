import axios from 'axios';

import { logApiError } from './logApiError';

const FALLBACK_BASE_URL = 'http://127.0.0.1:3000';
const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const baseURL = envBaseUrl || FALLBACK_BASE_URL;

if (!envBaseUrl) {
  console.warn(
    'EXPO_PUBLIC_API_BASE_URL is not set. Falling back to localhost, which will fail on physical devices. Set it to your LAN IP (http://192.168.x.x:3000) or ngrok/cloud URL.',
  );
}

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  timeoutErrorMessage: 'Request timed out. Check your API tunnel and internet connection.',
});

// Ngrok free tier serves an HTML interstitial unless this header is sent on API requests.
if (typeof baseURL === 'string' && baseURL.includes('ngrok')) {
  apiClient.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
}

if (__DEV__) {
  console.log('API BASE URL:', baseURL);
  console.log('BASE_URL', baseURL);
}

/** Same base URL as axios — used by `eventAssets` multipart upload (fetch). */
export const API_BASE_URL = baseURL;

apiClient.interceptors.request.use(
  (config) => {
    console.log('BASE_URL', config?.baseURL);
    console.log('REQUEST_URL', `${config?.baseURL || ''}${config?.url || ''}`);
    console.log('METHOD:', config?.method);
    console.log('URL:', config?.url);
    console.log('REQUEST HEADERS:', config.headers);
    console.log('REQUEST BODY:', config.data);
    console.log('IS_FORMDATA:', config?.data instanceof FormData);
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    logApiError(error);
    return Promise.reject(error);
  },
);

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
