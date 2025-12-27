import { DLQMessageWithId, DLQStats } from '@/types/transaction';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // In a real app, you'd get this from a secure storage or context
  // For now, we'll assume the API might not need auth in this specific dev/qa context 
  // or we use a hardcoded/env token if provided.
  const token = localStorage.getItem('elst_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'API request failed');
  }

  return result.data;
}

export const statsApi = {
  getGeneral: (): Promise<import('@/types/transaction').GeneralStats> => 
    fetchWithAuth('/stats'),
};

export const authApi = {
  validateToken: async (token: string): Promise<{ valid: boolean; user?: any }> => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Use the /stats endpoint to validate the token since /auth/validate doesn't exist
      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return { valid: false };
      }

      // If we can successfully fetch stats, the token is valid
      return { 
        valid: true, 
        user: {
          id: 'user_1',
          name: 'Admin User',
          email: 'admin@eaglelion.tech'
        }
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

  getMessages: (params: { limit?: number; startId?: string; errorType?: string } = {}): Promise<{ messages: DLQMessageWithId[], pagination: any }> => {
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
