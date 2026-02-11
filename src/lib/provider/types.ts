/**
 * Provider 接口定义
 * 定义统一的 Provider 接口，支持策略模式实现不同 Provider 的适配
 */

import type {
  ProviderUsage,
  ProviderModel,
  UsageParams,
  CostParams,
  ModelsParams,
  ProviderHealth,
} from '@/types/api';

/**
 * Provider 配置验证结果
 */
export interface ProviderValidationResult {
  isValid: boolean;
  message: string;
  errorCode?: string;
}

/**
 * Provider 使用量数据 (标准化格式)
 */
export interface NormalizedUsage {
  id: string;
  modelId: string;
  modelName: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  currency: string;
  date: string;
  sessionId?: string;
  projectId?: string;
}

/**
 * Provider 模型定价
 */
export interface ModelPricing {
  modelId: string;
  modelName: string;
  provider: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  currency: string;
}

/**
 * Provider 统一接口
 */
export interface IProvider {
  /** Provider 名称 */
  readonly name: string;
  /** Provider 版本 */
  readonly version: string;
  /** Provider 显示名称 */
  readonly displayName: string;

  /**
   * 设置 API Key
   */
  setApiKey(apiKey: string): void;

  /**
   * 验证配置是否有效
   */
  validateConfig(): Promise<ProviderValidationResult>;

  /**
   * 获取使用量数据
   * @param params - 查询参数
   * @returns 标准化的使用量数据数组
   */
  fetchUsage(params: UsageParams): Promise<NormalizedUsage[]>;

  /**
   * 获取模型列表
   * @param params - 查询参数
   * @returns 模型定价信息数组
   */
  fetchModels(params?: ModelsParams): Promise<ModelPricing[]>;

  /**
   * 获取成本数据
   * @param params - 查询参数
   * @returns 成本数据
   */
  fetchCosts(params: CostParams): Promise<{
    total: number;
    byModel: Record<string, number>;
    byDay: Record<string, number>;
  }>;

  /**
   * 计算 Token 成本
   * @param inputTokens - 输入 Token 数量
   * @param outputTokens - 输出 Token 数量
   * @param modelId - 模型 ID
   * @returns 成本金额
   */
  calculateCost(
    inputTokens: number,
    outputTokens: number,
    modelId: string
  ): number;

  /**
   * 健康检查
   */
  healthCheck(): Promise<ProviderHealth>;

  /**
   * 获取 Rate Limit 剩余请求数
   */
  getRateLimitInfo(): {
    remaining: number;
    limit: number;
    resetAt: string;
  } | null;
}

/**
 * Provider 类构造函数类型
 */
export type ProviderConstructor = new (
  apiKey: string,
  options?: ProviderOptions
) => IProvider;

/**
 * Provider 选项
 */
export interface ProviderOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Provider 注册信息
 */
export interface ProviderRegistryInfo {
  name: string;
  displayName: string;
  version: string;
  constructor: ProviderConstructor;
  features: {
    supportsUsage: boolean;
    supportsModels: boolean;
    supportsCosts: boolean;
    requiresApiKey: boolean;
  };
  defaultTimeout: number;
}

/**
 * Provider 配置验证规则
 */
export interface ProviderValidationRule {
  name: string;
  validate: (value: unknown) => boolean;
  message: string;
}

/**
 * Provider 能力枚举
 */
export enum ProviderCapability {
  USAGE_READ = 'usage:read',
  MODELS_READ = 'models:read',
  COSTS_READ = 'costs:read',
  HEALTH_CHECK = 'health:check',
}

/**
 * Provider 元信息
 */
export interface ProviderMetadata {
  name: string;
  displayName: string;
  description: string;
  website?: string;
  logoUrl?: string;
  documentationUrl?: string;
}
