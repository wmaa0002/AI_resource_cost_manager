/**
 * API 相关类型扩展
 * 定义 API 层的类型，与业务层的 Business Types 区分
 */

// ==================== API Response Types ====================

/**
 * 通用 API 响应结构
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: ApiError;
  timestamp: string;
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * API 错误响应
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 错误码枚举
 */
export const ApiErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

// ==================== Provider API Types ====================

/**
 * Provider API 配置 (扩展)
 */
export interface ProviderApiConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  features: {
    supportsUsage: boolean;
    supportsModels: boolean;
    supportsCosts: boolean;
  };
}

/**
 * Provider 使用量 API 参数
 */
export interface UsageParams {
  startDate: string;
  endDate: string;
  modelId?: string;
  projectId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Provider 成本 API 参数
 */
export interface CostParams {
  startDate: string;
  endDate: string;
  modelId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'model' | 'provider';
}

/**
 * Provider 模型 API 参数
 */
export interface ModelsParams {
  provider?: string;
  isAvailable?: boolean;
}

/**
 * Provider 使用量记录 (API 原始格式)
 */
export interface ProviderUsage {
  id: string;
  model_id: string;
  model_name: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  currency: string;
  date: string;
  session_id?: string;
  project_id?: string;
  created_at?: string;
}

/**
 * Provider 成本记录 (API 原始格式)
 */
export interface ProviderCost {
  id: string;
  model_id: string;
  model_name: string;
  provider: string;
  input_cost: number;
  output_cost: number;
  total_cost: number;
  currency: string;
  date: string;
  period?: string;
}

/**
 * Provider 模型信息 (API 原始格式)
 */
export interface ProviderModel {
  id: string;
  name: string;
  provider: string;
  input_price_per_million: number;
  output_price_per_million: number;
  currency: string;
  is_available: boolean;
  capabilities?: string[];
  context_length?: number;
}

// ==================== Rate Limit Types ====================

/**
 * Rate Limit 信息
 */
export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: string;
  resetInSeconds: number;
}

// ==================== Health Check Types ====================

/**
 * Provider 健康检查结果
 */
export interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  message?: string;
  checkedAt: string;
}

// ==================== Request Options ====================

/**
 * Fetch 请求选项
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * API 请求配置
 */
export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  provider: string;
  options?: RequestOptions;
}

// ==================== API Response 构造函数 ====================

/**
 * 创建成功响应
 */
export function createApiResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    data,
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建错误响应
 */
export function createApiError<T>(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiResponse<T> {
  return {
    data: null as T,
    success: false,
    message,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    data,
    success: true,
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}
