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

export interface ProductPayload {
  productId: number;
  name: string;
  description?: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  ownerAddress: string;
  price: string; // in TC, human-readable string
  txHash: string;
  imageURI?: string;
}


export async function saveProduct(payload: ProductPayload): Promise<boolean> {
  const result = await request<{ success: boolean }>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return !!result?.success;
}


export async function updateProduct(
  productId: number,
  update: Partial<Pick<ProductPayload, 'ownerAddress' | 'price' | 'name' | 'description'>> & {
    isListed?: boolean;
  }
): Promise<boolean> {
  const result = await request<{ success: boolean }>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
  return !!result?.success;
}

export interface StoredProduct {
  _id: string;
  productId: number;
  name: string;
  description: string;
  ipfsHash: string;
  ipfsUrl: string;
  imageURI: string;
  ownerAddress: string;
  price: string;
  txHash: string;
  isListed: boolean;
  createdAt: string;
}


export async function fetchProducts(params?: {
  isListed?: boolean;
  owner?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<StoredProduct[] | null> {
  const query = new URLSearchParams();
  if (params?.isListed !== undefined) query.set('isListed', String(params.isListed));
  if (params?.owner) query.set('owner', params.owner);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const result = await request<{ success: boolean; products: StoredProduct[] }>(
    `/products${qs ? `?${qs}` : ''}`
  );
  return result?.products ?? null;
}

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
