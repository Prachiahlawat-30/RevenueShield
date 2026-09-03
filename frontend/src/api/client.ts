import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});
