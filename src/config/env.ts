/**
 * Environment configuration for Voymate Mobile
 *
 * All environment variables are loaded securely from the parent `.env` file
 * using Expo's standard `EXPO_PUBLIC_*` convention.
 *
 * DO NOT hardcode local IPs, tunnels, or API secrets in this file.
 */

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.voymate.nasifhub.online/api/v1';
const cleanApiUrl = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
const API_URL = cleanApiUrl.includes('/api/v1') ? cleanApiUrl : `${cleanApiUrl}/api/v1`;

const rawSocketUrl =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  cleanApiUrl.replace(/\/api\/v1\/?$/, '');
const SOCKET_URL = rawSocketUrl.endsWith('/') ? rawSocketUrl.slice(0, -1) : rawSocketUrl;

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '189540352036-v3sgrcr0eolkpi56sun6muagngr7acq1.apps.googleusercontent.com';

export const ENV = {
  API_URL,
  SOCKET_URL,
  GOOGLE_WEB_CLIENT_ID,
  IS_DEV: __DEV__,
} as const;
