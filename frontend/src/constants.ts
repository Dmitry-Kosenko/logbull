interface RuntimeConfig {
  IS_CLOUD?: string;
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

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

// First try runtime config, then build-time env var, then default to false
export const IS_CLOUD =
  window.__RUNTIME_CONFIG__?.IS_CLOUD === 'true' || import.meta.env.VITE_IS_CLOUD === 'true';
