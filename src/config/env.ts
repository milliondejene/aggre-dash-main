const QA_AGGREGATOR_BASE =
  'https://qaapp.dashenbanksc.com/v2.0/chatbirrapi/aggregator';

/** Browser builds must use same-origin `/api` (Vite/Vercel proxy). Absolute URLs cause CORS. */
function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL || '/api';
  if (import.meta.env.PROD && configured.startsWith('http')) {
    return '/api';
  }
  return configured;
}

export const env = {
  /** Same-origin `/api` in production (Vercel rewrite); direct URL optional for local dev */
  apiUrl: resolveApiUrl(),
  aggregatorBaseUrl:
    import.meta.env.VITE_AGGREGATOR_BASE_URL || QA_AGGREGATOR_BASE,
  auth: {
    username: import.meta.env.VITE_AUTH_USERNAME || 'aggregator_admin',
    password: import.meta.env.VITE_AUTH_PASSWORD || 'aggregator_pass',
    token: import.meta.env.VITE_AUTH_TOKEN || '',
  },
} as const;

export function validateCredentials(username: string, password: string): boolean {
  return (
    username.trim() === env.auth.username &&
    password === env.auth.password
  );
}
