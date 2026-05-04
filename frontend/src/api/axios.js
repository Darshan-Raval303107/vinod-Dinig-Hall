import axios from 'axios';
import { useAuthStore } from '../store';

const rawApiBase = (import.meta.env.VITE_API_URL || '').trim();
const rawApiOrigin = (import.meta.env.VITE_API_ORIGIN || '').trim();
const DEFAULT_REMOTE_ORIGIN = 'https://vinod-dinig-hall.onrender.com';

const resolveApiBaseUrl = () => {
  if (rawApiBase) return rawApiBase;
  return 'https://vinod-dinig-hall.onrender.com/api';
};

export const API_BASE_URL = resolveApiBaseUrl();
export const API_ORIGIN = (() => {
  if (rawApiOrigin) return rawApiOrigin;

  try {
    if (/^https?:\/\//i.test(API_BASE_URL)) {
      return new URL(API_BASE_URL).origin;
    }
  } catch {}

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin;
    }
  }

  return DEFAULT_REMOTE_ORIGIN;
})();

export const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  try {
    return new URL(path, API_ORIGIN).toString();
  } catch {
    return path;
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
