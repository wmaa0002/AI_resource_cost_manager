/**
 * 用量数据类型定义
 */

/**
 * 每日用量数据
 */
export interface DailyUsage {
  date: string;           // 日期 (YYYY-MM-DD)
  inputTokens: number;    // 输入 Token 数量
  outputTokens: number;   // 输出 Token 数量
  cost: number;           // 成本金额
  modelName: string;      // 模型名称
  metadata?: Record<string, unknown>;  // 其他元数据
}

/**
 * 用量 API 响应
 */
export interface UsageResponse {
  success: boolean;
  error?: string;
  message?: string;
  data: DailyUsage[];
  totalUsage?: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

/**
 * Provider 用量数据汇总
 */
export interface ProviderUsageSummary {
  provider: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  dailyData: DailyUsage[];
  lastUpdated: string | null;
}

/**
 * 图表数据点
 */
export interface ChartDataPoint {
  date: string;
  [provider: string]: number | string;
}

/**
 * 用量趋势数据
 */
export interface UsageTrend {
  period: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}
