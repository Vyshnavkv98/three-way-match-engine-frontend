import axios, { type AxiosError } from 'axios';
import type {
  CreateSkuMasterPayload,
  DocumentDetail,
  LoginRequest,
  LoginResponse,
  MatchResult,
  PaginatedDocuments,
  SkuMaster,
  SummaryResult,
  UploadResponse,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({ baseURL: BASE_URL });

// Attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Structured API error ─────────────────────────────────────────────────
export interface ApiError extends Error {
  code?: string;
  success?: boolean;
}

/** Build an enriched error from any backend response shape */
function buildApiError(err: AxiosError): ApiError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = err.response?.data as any;

  // Shape 1: { success: false, code: "DUPLICATE_GRN", message: "..." }
  if (body && typeof body.message === 'string') {
    const e: ApiError = new Error(body.message);
    e.code    = body.code ?? undefined;
    e.success = body.success ?? false;
    return e;
  }

  // Shape 2: { error: { message: "...", issues: [...] } }
  if (body?.error) {
    const issues: string[] | undefined = body.error.issues;
    const msg = issues?.join('; ') ?? body.error.message ?? err.message ?? 'Unknown error';
    const e: ApiError = new Error(msg);
    e.code = body.error.code ?? undefined;
    return e;
  }

  // Fallback: plain network / axios error
  return Object.assign(new Error(err.message ?? 'Unknown error'), { code: undefined });
}

// Surface clean error messages
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => Promise.reject(buildApiError(err)),
);

// ── Auth ───────────────────────────────────────────────────────────────────

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
};

// ── Documents ─────────────────────────────────────────────────────────────

export const listDocuments = async (params: Record<string, string | number>): Promise<PaginatedDocuments> => {
  const { data } = await apiClient.get<PaginatedDocuments>('/documents', { params });
  return data;
};

export const getDocument = async (id: string): Promise<DocumentDetail> => {
  const { data } = await apiClient.get<{ data: DocumentDetail }>(`/documents/${id}`);
  return data.data;
};

export const getDocumentFileUrl = (id: string): string =>
  `${BASE_URL}/documents/${id}/file`;

export const getDocumentFileBlob = async (id: string): Promise<Blob> => {
  const { data } = await apiClient.get<Blob>(`/documents/${id}/file`, {
    responseType: 'blob',
  });
  return data;
};

export const uploadDocument = async (
  file: File,
  documentType: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> => {
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  const { data } = await apiClient.post<UploadResponse>('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
};

// ── SKU Master ─────────────────────────────────────────────────────────────

export const listSkuMasters = async (params?: { search?: string; isActive?: string }): Promise<SkuMaster[]> => {
  const { data } = await apiClient.get<{ data: SkuMaster[] }>('/masters/sku', { params });
  return data.data;
};

export const getSkuMaster = async (id: string): Promise<SkuMaster> => {
  const { data } = await apiClient.get<{ data: SkuMaster }>(`/masters/sku/${id}`);
  return data.data;
};

export const createSkuMaster = async (payload: CreateSkuMasterPayload): Promise<SkuMaster> => {
  const { data } = await apiClient.post<{ data: SkuMaster }>('/masters/sku', payload);
  return data.data;
};

export const updateSkuMaster = async (id: string, payload: Partial<CreateSkuMasterPayload>): Promise<SkuMaster> => {
  const { data } = await apiClient.patch<{ data: SkuMaster }>(`/masters/sku/${id}`, payload);
  return data.data;
};

export const deleteSkuMaster = async (id: string): Promise<void> => {
  await apiClient.delete(`/masters/sku/${id}`);
};

// ── Match ──────────────────────────────────────────────────────────────────

export const getMatch = async (poNumber: string): Promise<MatchResult> => {
  const { data } = await apiClient.get<MatchResult>(`/match/${encodeURIComponent(poNumber)}`);
  return data;
};

// ── Summary ────────────────────────────────────────────────────────────────

export const getSummary = async (poNumber: string): Promise<SummaryResult> => {
  const { data } = await apiClient.get<SummaryResult>(`/summary/${encodeURIComponent(poNumber)}`);
  return data;
};
