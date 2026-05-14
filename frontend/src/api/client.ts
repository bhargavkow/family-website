import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // 1. If we are on a production URL (Vercel), always use the environment variable
  if (envUrl && envUrl.includes('onrender.com')) return envUrl;

  // 2. If we are testing on a phone (accessing via IP like 192.168.x.x), 
  // dynamically point to the backend on the same IP
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('vercel.app')) {
    return `http://${hostname}:5000/api`;
  }

  // 3. Fallback to env variable or localhost
  return envUrl || 'http://localhost:5000/api';
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
