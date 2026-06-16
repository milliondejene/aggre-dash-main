import { DLQMessageWithId, DLQStats } from '@/types/transaction';
import { env } from '@/config/env';

const API_BASE_URL = env.apiUrl;

interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('elst_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result: ApiResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'API request failed');
  }

  return result.data;
}

export const healthApi = {
  check: async (): Promise<{ status: string; uptime: number }> => {
    const response = await fetch(`${API_BASE_URL}/healthcheck`);
    const result: ApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Health check failed');
    }

    return result.data as { status: string; uptime: number };
  },
};

export const statsApi = {
  getGeneral: (): Promise<import('@/types/transaction').GeneralStats> =>
    fetchWithAuth('/stats'),
};

export const authApi = {
  validateToken: async (token: string): Promise<{ valid: boolean; user?: { id: string; name: string; email: string } }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: 'aggregator_admin',
          name: env.auth.username,
          email: `${env.auth.username}@eaglelion.tech`,
        },
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false };
    }
  },
};

export const dlqApi = {
  getStats: (): Promise<DLQStats> =>
    fetchWithAuth('/dlq/stats'),

  getMessages: (params: { limit?: number; startId?: string; errorType?: string } = {}): Promise<{ messages: DLQMessageWithId[]; pagination: Record<string, unknown> }> => {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.startId) query.append('startId', params.startId);
    if (params.errorType) query.append('errorType', params.errorType);
    return fetchWithAuth(`/dlq/messages?${query.toString()}`);
  },

  getMessage: (id: string): Promise<DLQMessageWithId> =>
    fetchWithAuth(`/dlq/messages/${id}`),

  retryMessage: (id: string): Promise<{ dlqMessageId: string }> =>
    fetchWithAuth(`/dlq/messages/${id}/retry`, { method: 'POST' }),

  deleteMessage: (id: string): Promise<{ dlqMessageId: string }> =>
    fetchWithAuth(`/dlq/messages/${id}`, { method: 'DELETE' }),

  bulkRetry: (messageIds: string[]): Promise<{ successful: number; failed: number }> =>
    fetchWithAuth('/dlq/messages/bulk-retry', {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    }),

  bulkDelete: (messageIds: string[]): Promise<{ successful: number; failed: number }> =>
    fetchWithAuth('/dlq/messages/bulk-delete', {
      method: 'DELETE',
      body: JSON.stringify({ messageIds }),
    }),
};
