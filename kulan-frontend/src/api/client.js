import axios from 'axios';

const FALLBACK_BASE_URL = 'http://127.0.0.1:3000';
const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const baseURL = envBaseUrl || FALLBACK_BASE_URL;

if (!envBaseUrl) {
  console.warn(
    'EXPO_PUBLIC_API_BASE_URL is not set. Falling back to localhost, which will fail on physical devices. Set the env to your ngrok/cloud URL.',
  );
}

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  timeoutErrorMessage: 'Request timed out. Check your API tunnel and internet connection.',
});

console.log('API BASE URL:', baseURL);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const endpoint = error?.config?.url;
    const ngrokErrorCode = error?.response?.headers?.['ngrok-error-code'];
    const contentType = error?.response?.headers?.['content-type'] || '';
    const isHtmlError = typeof contentType === 'string' && contentType.includes('text/html');

    console.log(
      'API ERROR:',
      status ? `${status}` : 'unknown-status',
      endpoint || 'unknown-endpoint',
      '-',
      error.message
    );

    if (ngrokErrorCode) {
      console.log('NGROK ERROR CODE:', ngrokErrorCode);
    }

    // Avoid dumping full HTML error pages into the app logs.
    if (!isHtmlError) {
      console.log('API ERROR DETAILS:', error?.response?.data || error.response || error);
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
