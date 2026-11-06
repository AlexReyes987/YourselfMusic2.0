import axios from 'axios';

const resolveBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '/api';
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
};

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
