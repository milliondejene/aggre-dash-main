const STAGING_AGGREGATOR_BASE =
  'https://stagingapp.dashenbanksc.com/v2.0/chatbirrapi/aggregator';

export const env = {
  /** Same-origin `/api` in production (Vercel rewrite); direct URL optional for local dev */
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  aggregatorBaseUrl:
    import.meta.env.VITE_AGGREGATOR_BASE_URL || STAGING_AGGREGATOR_BASE,
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
