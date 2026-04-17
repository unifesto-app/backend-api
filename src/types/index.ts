// Core type definitions
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
};

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type User = {
  id: string;
  email: string;
  role?: string;
  status?: string;
};

export type AuthContext = {
  user: User;
  supabase: any;
  accessToken: string | null;
};
