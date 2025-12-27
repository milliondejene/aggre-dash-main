export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  FTNumber: string;
  reference: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  provider: string;
  metadata: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TransactionFilters {
  status?: TransactionStatus | '';
  search?: string;
  provider?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TransactionStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  totalAmount: number;
}

export interface Provider {
  id: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
}

export interface DLQMessage {
  originalMessageId: string;
  originalStream: string;
  consumerGroup: string;
  transactionData: any;
  error: string;
  errorType: 'VALIDATION' | 'TRANSIENT' | 'PERMANENT';
  retryCount: number;
  failedAt: string;
  originalTimestamp: string;
}

export interface DLQMessageWithId extends DLQMessage {
  dlqMessageId: string;
  ageMs: number;
  ageDays: number;
}

export interface DLQStats {
  length: number;
  maxRetries: number;
  retentionDays: number;
  errorTypeBreakdown: {
    VALIDATION: number;
    TRANSIENT: number;
    PERMANENT: number;
  };
  oldestMessageAgeDays: number | null;
  newestMessageAgeDays: number | null;
}


export interface GeneralStats {
  uptime: number;
  processing: {
    totalProcessed: number;
    totalSuccess: number;
    totalFailed: number;
    totalMaxRetriesExceeded: number;
    totalDLQ: number;
  };
  database: {
    totalTransactions: number;
    successCount: number;
    maxRetriesExceededCount: number;
    pendingCount: number;
    processingCount: number;
  };
  redis: {
    streamLength: number;
    pendingMessages: number;
    connected: boolean;
    alertLevel: string;
  };
  dlq: {
    length: number;
    lastChecked: string | null;
  };
  connections: {
    redis: boolean;
    database: boolean;
  };
}
