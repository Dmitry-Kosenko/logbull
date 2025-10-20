export function getApplicationServer() {
  const origin = window.location.origin;
  const url = new URL(origin);

  const isDevelopment = import.meta.env.MODE === 'development';

  if (isDevelopment) {
    return `${url.protocol}//${url.hostname}:4005`;
  } else {
    return `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`;
  }
}

export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || 'dev';
export const IS_CLOUD = import.meta.env.VITE_IS_CLOUD === 'true';
