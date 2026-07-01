import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;

  // 1. If running in development mode (Vite dev server)
  if (import.meta.env.DEV) {
    // If testing on a phone/LAN (accessing via IP like 192.168.x.x), 
    // dynamically point to the backend on the same IP
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
    return envUrl || 'http://localhost:5000/api';
  }

  // 2. If running in production mode
  // If VITE_API_URL is configured and secure (https://), use it.
  // If it is insecure (http://), it will cause Mixed Content errors on Vercel HTTPS,
  // so we ignore it and fall back to proxying via '/api'.
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl;
  }

  // Fallback to relative API path if frontend and backend share the same domain/proxy
  return '/api';
};

const client = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token from localStorage
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 globally
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Let components handle redirect logic
    }
    return Promise.reject(err);
  }
);

export default client;
