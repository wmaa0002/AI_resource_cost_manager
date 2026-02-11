/**
 * AI Cost Tracker - Type Definitions
 * Based on ai-cost-tracker-design.md
 */

// 计费模式类型
export type BillingMode = 'daily' | 'monthly' | 'yearly' | 'one-time';

// 成本源类型
export type CostSourceType = 'api' | 'subscription' | 'hardware' | 'one-time';

// 货币类型
export type Currency = 'CNY' | 'USD' | 'EUR';

// 成本源接口
export interface CostSource {
  id: string;                    // 唯一标识符
  name: string;                   // 成本源名称
  type: CostSourceType;          // 成本类型
  provider?: string;              // Provider 名称（如 OpenCode）
  billingMode: BillingMode;       // 计费模式
  cost: number;                  // 金额
  currency: Currency;            // 货币类型
  startDate?: string;            // 生效开始日期 (ISO date string)
  endDate?: string;              // 生效结束日期 (ISO date string, 可选)
  isEnabled: boolean;            // 是否启用计算
  description?: string;           // 描述信息
  createdAt: string;            // 创建时间 (ISO date string)
  updatedAt: string;             // 更新时间 (ISO date string)
}

// OpenCode 使用数据接口
export interface OpenCodeUsage {
  id: string;                     // 唯一标识符
  modelId: string;               // 模型 ID
  modelName: string;             // 模型名称
  provider: string;              // Provider 名称
  inputTokens: number;            // 输入 Token 数量
  outputTokens: number;           // 输出 Token 数量
  totalTokens: number;            // 总 Token 数量
  cost: number;                  // 成本金额
  currency: Currency;            // 货币类型
  date: string;                  // 使用日期 (ISO date string)
  sessionId?: string;            // 会话 ID（可选）
  projectId?: string;            // 项目 ID（可选）
}

// Provider 模型信息
export interface ModelInfo {
  id: string;                    // 模型 ID
  name: string;                  // 模型名称
  provider: string;              // Provider 名称
  inputPricePerM: number;         // 输入价格（每百万 Token）
  outputPricePerM: number;        // 输出价格（每百万 Token）
  currency: Currency;            // 货币类型
}

// Provider API 配置
export interface ProviderConfig {
  provider: string;              // Provider 名称
  apiKey: string;                // API Key
  baseUrl?: string;              // API 基础 URL（可选）
  isEnabled: boolean;            // 是否启用
}

// 成本汇总接口
export interface CostSummary {
  totalDailyCost: number;         // 日总成本
  totalMonthlyCost: number;      // 月总成本
  totalYearlyCost: number;        // 年总成本
  enabledSourcesCount: number;    // 已启用成本源数量
  totalSourcesCount: number;      // 成本源总数
  costByProvider: Record<string, number>;  // 按 Provider 分组的成本
  costByType: Record<string, number>;      // 按类型分组的成本
  monthlyTrend: MonthlyTrend[];   // 月度趋势数据
}

// 月度趋势数据接口
export interface MonthlyTrend {
  month: string;                 // 月份标识 (YYYY-MM)
  cost: number;                  // 该月成本
}

// 成本对比数据接口
export interface CostComparison {
  currentMonth: number;
  previousMonth: number;
  change: number;
  changePercent: number;
  projection: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

// 用户配置接口
export interface UserConfig {
  defaultCurrency: Currency;      // 默认货币
  theme: 'light' | 'dark' | 'system';  // 主题
  dateFormat: string;            // 日期格式
  providerConfigs: ProviderConfig[];  // Provider 配置列表
}

// 成本源表单数据类型
export interface CostSourceFormData {
  name: string;
  type: CostSourceType;
  provider?: string;
  billingMode: BillingMode;
  cost: number;
  currency: Currency;
  startDate?: string;
  endDate?: string;
  description?: string;
  isEnabled: boolean;
}

// API 配置表单数据类型
export interface ApiConfigFormData {
  provider: string;
  apiKey: string;
  baseUrl: string;
  isEnabled: boolean;
}

// 成本统计过滤器
export interface CostFilter {
  startDate?: string;
  endDate?: string;
  provider?: string;
  type?: CostSourceType;
  billingMode?: BillingMode;
  isEnabled?: boolean;
}

// 本地存储键名常量
export const STORAGE_KEYS = {
  SOURCES: 'cost-tracker:sources',
  USAGE: 'cost-tracker:usage',
  CONFIG: 'cost-tracker:config',
  LAST_SYNC: 'cost-tracker:last-sync',
} as const;
