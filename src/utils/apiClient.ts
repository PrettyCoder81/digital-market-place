/**
 * API Client Utility
 * Talks to the Express + MongoDB backend (http://localhost:5000) so that
 * blockchain transactions get persisted server-side and can be listed in the UI.
 *
 * All functions are best-effort: if the backend is unreachable they log a
 * warning and return null instead of throwing, so the Web3 flow never breaks.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export interface TransactionLogPayload {
  txHash: string;
  type: 'CREATE' | 'MINT' | 'BUY' | 'SELL' | 'TRANSFER' | 'WITHDRAW' | 'FEE_UPDATE' | 'LISTING' | 'UNLISTING';
  from: string;
  to?: string;
  productId?: number;
  amount?: string;
  blockNumber?: number;
  gasUsed?: string;
  status?: 'pending' | 'confirmed' | 'failed';
}

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      console.warn(`API ${options?.method || 'GET'} ${path} failed with status ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`API request to ${path} failed (is the backend running?):`, error);
    return null;
  }
}

/**
 * Log a confirmed blockchain transaction to MongoDB via the backend.
 * Returns true when the backend acknowledged the record.
 */
export async function logTransaction(payload: TransactionLogPayload): Promise<boolean> {
  const result = await request<{ success: boolean }>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return !!result?.success;
}

export interface StoredTransaction {
  _id: string;
  txHash: string;
  type: TransactionLogPayload['type'];
  productId?: number;
  from: string;
  to?: string;
  amount: string;
  blockNumber?: number;
  gasUsed?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

/**
 * Fetch stored transactions (newest first) for frontend display.
 */
export async function fetchTransactions(params?: {
  type?: string;
  from?: string;
  productId?: number;
  page?: number;
  limit?: number;
}): Promise<StoredTransaction[] | null> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.from) query.set('from', params.from);
  if (params?.productId !== undefined) query.set('productId', String(params.productId));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const result = await request<{ success: boolean; transactions: StoredTransaction[] }>(
    `/transactions${qs ? `?${qs}` : ''}`
  );
  return result?.transactions ?? null;
}
