import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3005',
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const msg = error.response.data?.message || error.response.data?.error || '';
      if (msg.includes('expired') || msg.includes('Unauthorized')) {
        console.warn('Session expired or unauthorized. Redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;