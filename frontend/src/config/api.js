const FALLBACK_URL = 'http://localhost:5000';

const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '');

const ENV_API_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);
const ENV_SOCKET_URL = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL);

const API_BASE_URL = ENV_API_URL || ENV_SOCKET_URL || FALLBACK_URL;
const SOCKET_URL = ENV_SOCKET_URL || ENV_API_URL || FALLBACK_URL;

export function apiUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export { API_BASE_URL, SOCKET_URL };
