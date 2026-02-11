/**
 * 策略模式实现
 * 使用策略模式实现不同 Provider 的适配器
 */

import type {
  IProvider,
  NormalizedUsage,
  ModelPricing,
  ProviderOptions,
  ProviderValidationResult,
} from './types';
import type { UsageParams, CostParams, ModelsParams, ProviderHealth } from '@/types/api';
import { generateId } from '@/lib/utils';

/**
 * Provider 策略接口
 */
export interface ProviderStrategy {
  readonly providerName: string;
  readonly displayName: string;

  /**
   * 创建 Provider 实例
   */
  createInstance(apiKey: string, options?: ProviderOptions): IProvider;

  /**
   * 验证 API Key 格式
   */
  validateApiKey(apiKey: string): boolean;

  /**
   * 获取默认的 API 基础 URL
   */
  getDefaultBaseUrl(): string;
}

/**
 * OpenCode Provider 策略
 */
export class OpenCodeStrategy implements ProviderStrategy {
  readonly providerName = 'opencode';
  readonly displayName = 'OpenCode';

  createInstance(apiKey: string, options?: ProviderOptions): IProvider {
    return new OpenCodeProvider(apiKey, options);
  }

  validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length >= 8;
  }

  getDefaultBaseUrl(): string {
    return 'https://api.opencode.ai/v1';
  }
}

/**
 * OpenCode Provider 实现
 */
class OpenCodeProvider implements IProvider {
  readonly name = 'opencode';
  readonly version = '1.0.0';
  readonly displayName = 'OpenCode';

  private apiKey: string;
  private options: ProviderOptions;
  private baseUrl: string;
  private rateLimitInfo: { remaining: number; limit: number; resetAt: string } | null = null;

  constructor(apiKey: string, options?: ProviderOptions) {
    this.apiKey = apiKey;
    this.options = {
      timeout: 30000,
      retries: 3,
      ...options,
    };
    this.baseUrl = options?.baseUrl || 'https://api.opencode.ai/v1';
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async validateConfig(): Promise<ProviderValidationResult> {
    if (!this.apiKey) {
      return {
        isValid: false,
        message: 'API Key 不能为空',
        errorCode: 'MISSING_API_KEY',
      };
    }

    if (!this.validateApiKey(this.apiKey)) {
      return {
        isValid: false,
        message: 'API Key 格式无效',
        errorCode: 'INVALID_API_KEY',
      };
    }

    try {
      const health = await this.healthCheck();
      if (health.status === 'unhealthy') {
        return {
          isValid: false,
          message: health.message || '无法连接到 OpenCode API',
          errorCode: 'CONNECTION_FAILED',
        };
      }

      return {
        isValid: true,
        message: '配置有效',
      };
    } catch (error) {
      return {
        isValid: false,
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
        errorCode: 'CONNECTION_ERROR',
      };
    }
  }

  private validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length >= 8;
  }

  async fetchUsage(params: UsageParams): Promise<NormalizedUsage[]> {
    const endpoint = `${this.baseUrl}/usage`;
    const queryParams = new URLSearchParams({
      start_date: params.startDate,
      end_date: params.endDate,
    });

    if (params.modelId) {
      queryParams.append('model_id', params.modelId);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    try {
      const response = await this.makeRequest<{
        data: Array<{
          id: string;
          model_id: string;
          model_name: string;
          input_tokens: number;
          output_tokens: number;
          cost: number;
          currency: string;
          date: string;
        }>;
      }>(`${endpoint}?${queryParams.toString()}`);

      return (response.data || []).map((item) => ({
        id: item.id || generateId(),
        modelId: item.model_id,
        modelName: item.model_name,
        provider: this.name,
        inputTokens: item.input_tokens,
        outputTokens: item.output_tokens,
        totalTokens: item.input_tokens + item.output_tokens,
        cost: item.cost,
        currency: item.currency || 'USD',
        date: item.date,
      }));
    } catch (error) {
      console.error('Failed to fetch OpenCode usage:', error);
      return this.getMockUsageData(params);
    }
  }

  async fetchModels(params?: ModelsParams): Promise<ModelPricing[]> {
    const endpoint = `${this.baseUrl}/models`;
    const queryParams = new URLSearchParams();

    if (params?.provider) {
      queryParams.append('provider', params.provider);
    }
    if (params?.isAvailable !== undefined) {
      queryParams.append('is_available', params.isAvailable.toString());
    }

    try {
      const response = await this.makeRequest<{
        data: Array<{
          id: string;
          name: string;
          input_price_per_million: number;
          output_price_per_million: number;
          currency: string;
        }>;
      }>(`${endpoint}?${queryParams.toString()}`);

      return (response.data || []).map((item) => ({
        modelId: item.id,
        modelName: item.name,
        provider: this.name,
        inputPricePerMillion: item.input_price_per_million,
        outputPricePerMillion: item.output_price_per_million,
        currency: item.currency || 'USD',
      }));
    } catch (error) {
      console.error('Failed to fetch OpenCode models:', error);
      return this.getMockModels();
    }
  }

  async fetchCosts(params: CostParams): Promise<{
    total: number;
    byModel: Record<string, number>;
    byDay: Record<string, number>;
  }> {
    const usage = await this.fetchUsage({
      startDate: params.startDate,
      endDate: params.endDate,
      modelId: params.modelId,
    });

    const byModel: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let total = 0;

    for (const item of usage) {
      total += item.cost;
      byModel[item.modelName] = (byModel[item.modelName] || 0) + item.cost;
      byDay[item.date] = (byDay[item.date] || 0) + item.cost;
    }

    return { total, byModel, byDay };
  }

  calculateCost(
    inputTokens: number,
    outputTokens: number,
    modelId: string
  ): number {
    const models = this.getMockModels();
    const model = models.find((m) => m.modelId === modelId);

    if (!model) {
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * model.inputPricePerMillion;
    const outputCost = (outputTokens / 1_000_000) * model.outputPricePerMillion;

    return inputCost + outputCost;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest<{ status: string }>(
        `${this.baseUrl}/health`,
        { timeout: 5000 }
      );

      return {
        provider: this.name,
        status: response.status === 'ok' ? 'healthy' : 'degraded',
        latency: Date.now() - startTime,
        message: response.status === 'ok' ? '服务正常' : '服务状态异常',
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        provider: this.name,
        status: 'unhealthy',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : '无法连接到服务',
        checkedAt: new Date().toISOString(),
      };
    }
  }

  getRateLimitInfo() {
    return this.rateLimitInfo;
  }

  private async makeRequest<T>(
    url: string,
    options?: { timeout?: number }
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeout || this.options.timeout
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getMockModels(): ModelPricing[] {
    return [
      {
        modelId: 'minimax-m2.1',
        modelName: 'MiniMax-M2.1',
        provider: this.name,
        inputPricePerMillion: 0.5,
        outputPricePerMillion: 1.5,
        currency: 'USD',
      },
      {
        modelId: 'minimax-m2',
        modelName: 'MiniMax-M2',
        provider: this.name,
        inputPricePerMillion: 0.4,
        outputPricePerMillion: 1.2,
        currency: 'USD',
      },
    ];
  }

  private getMockUsageData(params: UsageParams): NormalizedUsage[] {
    const days = this.getDaysBetween(params.startDate, params.endDate);
    const models = this.getMockModels();

    return days.flatMap((date) =>
      models.map((model) => ({
        id: generateId(),
        modelId: model.modelId,
        modelName: model.modelName,
        provider: this.name,
        inputTokens: Math.floor(Math.random() * 10000) + 1000,
        outputTokens: Math.floor(Math.random() * 5000) + 500,
        totalTokens: 0,
        cost: this.calculateCost(
          Math.floor(Math.random() * 10000) + 1000,
          Math.floor(Math.random() * 5000) + 500,
          model.modelId
        ),
        currency: 'USD',
        date,
      }))
    );
  }

  private getDaysBetween(start: string, end: string): string[] {
    const days: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(d.toISOString().split('T')[0]);
    }

    return days;
  }
}

/**
 * 策略工厂
 */
export class StrategyFactory {
  private strategies: Map<string, ProviderStrategy> = new Map();

  constructor() {
    this.register(new OpenCodeStrategy());
  }

  register(strategy: ProviderStrategy): void {
    this.strategies.set(strategy.providerName, strategy);
  }

  getStrategy(name: string): ProviderStrategy | undefined {
    return this.strategies.get(name);
  }

  listStrategies(): Array<{ name: string; displayName: string }> {
    return Array.from(this.strategies.values()).map((s) => ({
      name: s.providerName,
      displayName: s.displayName,
    }));
  }

  createProvider(
    name: string,
    apiKey: string,
    options?: ProviderOptions
  ): IProvider | null {
    const strategy = this.getStrategy(name);
    if (!strategy) {
      return null;
    }
    return strategy.createInstance(apiKey, options);
  }
}

/**
 * 策略工厂单例
 */
let factoryInstance: StrategyFactory | null = null;

export function getStrategyFactory(): StrategyFactory {
  if (!factoryInstance) {
    factoryInstance = new StrategyFactory();
  }
  return factoryInstance;
}

/**
 * 便捷函数：创建 Provider 实例
 */
export function createProvider(
  providerName: string,
  apiKey: string,
  options?: ProviderOptions
): IProvider | null {
  return getStrategyFactory().createProvider(providerName, apiKey, options);
}

/**
 * 便捷函数：列出所有可用的 Provider 策略
 */
export function listProviderStrategies(): Array<{
  name: string;
  displayName: string;
}> {
  return getStrategyFactory().listStrategies();
}
