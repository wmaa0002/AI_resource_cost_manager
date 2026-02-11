/**
 * Token 成本计算器
 * 提供 Token 成本计算、成本换算等核心功能
 */

import type { ModelPricing, NormalizedUsage } from './provider/types';
import type { CostSource, BillingMode, CostSummary, MonthlyTrend } from '@/types';
import {
  formatCurrency,
  daysBetween,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  parseDate,
} from '@/lib/utils';

/**
 * 成本计算器类
 */
export class CostCalculator {
  private readonly DAYS_IN_MONTH = 30;
  private readonly DAYS_IN_YEAR = 365;

  /**
   * 计算 Token 成本
   * @param inputTokens - 输入 Token 数量
   * @param outputTokens - 输出 Token 数量
   * @param pricing - 模型定价
   * @returns 成本金额
   */
  calculateTokenCost(
    inputTokens: number,
    outputTokens: number,
    pricing: ModelPricing
  ): number {
    const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;
    return this.roundCost(inputCost + outputCost);
  }

  /**
   * 将不同计费模式归一化到日成本
   * @param cost - 原始成本
   * @param mode - 计费模式
   * @returns 日成本
   */
  normalizeToDaily(cost: number, mode: BillingMode): number {
    switch (mode) {
      case 'daily':
        return cost;
      case 'monthly':
        return this.roundCost(cost / this.DAYS_IN_MONTH);
      case 'yearly':
        return this.roundCost(cost / this.DAYS_IN_YEAR);
      case 'one-time':
        return cost;
      default:
        return cost;
    }
  }

  /**
   * 将不同计费模式归一化到月成本
   * @param cost - 原始成本
   * @param mode - 计费模式
   * @returns 月成本
   */
  normalizeToMonthly(cost: number, mode: BillingMode): number {
    return this.roundCost(this.normalizeToDaily(cost, mode) * this.DAYS_IN_MONTH);
  }

  /**
   * 将不同计费模式归一化到年成本
   * @param cost - 原始成本
   * @param mode - 计费模式
   * @returns 年成本
   */
  normalizeToYearly(cost: number, mode: BillingMode): number {
    return this.roundCost(
      this.normalizeToDaily(cost, mode) * this.DAYS_IN_YEAR
    );
  }

  /**
   * 计算成本汇总
   * @param sources - 成本源数组
   * @returns 成本汇总信息
   */
  calculateSummary(sources: CostSource[]): CostSummary {
    const enabled = sources.filter((s) => s.isEnabled);

    const totalDaily = enabled.reduce(
      (sum, s) => sum + this.normalizeToDaily(s.cost, s.billingMode),
      0
    );

    const costByProvider: Record<string, number> = {};
    const costByType: Record<string, number> = {};

    enabled.forEach((source) => {
      const dailyCost = this.normalizeToDaily(source.cost, source.billingMode);

      const provider = source.provider || 'custom';
      costByProvider[provider] = (costByProvider[provider] || 0) + dailyCost;

      costByType[source.type] = (costByType[source.type] || 0) + dailyCost;
    });

    const monthlyTrend = this.calculateMonthlyTrend(enabled);

    return {
      totalDailyCost: this.roundCost(totalDaily),
      totalMonthlyCost: this.roundCost(totalDaily * this.DAYS_IN_MONTH),
      totalYearlyCost: this.roundCost(totalDaily * this.DAYS_IN_YEAR),
      enabledSourcesCount: enabled.length,
      totalSourcesCount: sources.length,
      costByProvider,
      costByType,
      monthlyTrend,
    };
  }

  /**
   * 计算月度趋势
   * @param sources - 成本源数组
   * @param months - 月数 (默认6个月)
   * @returns 月度趋势数据
   */
  calculateMonthlyTrend(
    sources: CostSource[],
    months: number = 6
  ): MonthlyTrend[] {
    const trend: MonthlyTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      let monthCost = 0;
      const monthStart = getFirstDayOfMonth(date);
      const monthEnd = getLastDayOfMonth(date);

      sources.forEach((source) => {
        const startDate = source.startDate ? parseDate(source.startDate) : null;
        const endDate = source.endDate ? parseDate(source.endDate) : null;

        if (
          (!startDate || monthEnd >= startDate) &&
          (!endDate || monthStart <= endDate)
        ) {
          monthCost += this.normalizeToMonthly(source.cost, source.billingMode);
        }
      });

      trend.push({
        month: monthKey,
        cost: this.roundCost(monthCost),
      });
    }

    return trend;
  }

  /**
   * 按时间范围筛选使用量数据
   * @param data - 使用量数据
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns 筛选后的数据
   */
  filterByDateRange(
    data: NormalizedUsage[],
    startDate: string,
    endDate: string
  ): NormalizedUsage[] {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    return data.filter((item) => {
      const itemDate = parseDate(item.date);
      return itemDate >= start && itemDate <= end;
    });
  }

  /**
   * 批量计算使用量成本
   * @param usages - 使用量数据
   * @param pricingMap - 模型定价映射
   * @returns 总成本和按模型分组的成本
   */
  calculateBatchCosts(
    usages: NormalizedUsage[],
    pricingMap: Map<string, ModelPricing>
  ): { total: number; byModel: Record<string, number> } {
    const byModel: Record<string, number> = {};
    let total = 0;

    for (const usage of usages) {
      const pricing = pricingMap.get(usage.modelId);
      const cost = pricing
        ? this.calculateTokenCost(
            usage.inputTokens,
            usage.outputTokens,
            pricing
          )
        : 0;

      total += cost;
      byModel[usage.modelName] = (byModel[usage.modelName] || 0) + cost;
    }

    return {
      total: this.roundCost(total),
      byModel,
    };
  }

  /**
   * 计算买断式成本分摊
   * @param totalCost - 买断总价
   * @param startDate - 开始使用日期
   * @param endDate - 结束日期 (可选)
   * @param months - 分摊月数
   * @returns 每月分摊成本
   */
  calculateAmortizedCost(
    totalCost: number,
    startDate: string,
    endDate: string | undefined,
    months: number = 12
  ): { monthlyCost: number; totalMonths: number; effectiveMonths: number } {
    const start = parseDate(startDate);
    const end = endDate ? parseDate(endDate) : new Date();
    const totalMonths = Math.max(
      1,
      (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1
    );
    const effectiveMonths = Math.min(totalMonths, months);

    return {
      monthlyCost: this.roundCost(totalCost / effectiveMonths),
      totalMonths,
      effectiveMonths,
    };
  }

  /**
   * 格式化成本金额
   * @param cost - 成本金额
   * @param currency - 货币
   * @returns 格式化后的字符串
   */
  formatCost(cost: number, currency: 'CNY' | 'USD' | 'EUR' = 'CNY'): string {
    return formatCurrency(cost, currency);
  }

  /**
   * 成本对比分析
   * @param currentSources - 当前成本源
   * @param previousSources - 历史成本源
   * @returns 对比结果
   */
  compareCosts(
    currentSources: CostSource[],
    previousSources: CostSource[]
  ): {
    currentMonthly: number;
    previousMonthly: number;
    change: number;
    changePercent: number;
  } {
    const currentSummary = this.calculateSummary(currentSources);
    const previousSummary = this.calculateSummary(previousSources);

    const currentMonthly = currentSummary.totalMonthlyCost;
    const previousMonthly = previousSummary.totalMonthlyCost;

    return {
      currentMonthly: this.roundCost(currentMonthly),
      previousMonthly: this.roundCost(previousMonthly),
      change: this.roundCost(currentMonthly - previousMonthly),
      changePercent:
        previousMonthly > 0
          ? this.roundCost(
              ((currentMonthly - previousMonthly) / previousMonthly) * 100
            )
          : 0,
    };
  }

  /**
   * 安全舍入成本 (避免浮点精度问题)
   * @param value - 原始值
   * @returns 舍入后的值
   */
  private roundCost(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

/**
 * 成本计算器单例
 */
let calculatorInstance: CostCalculator | null = null;

export function getCostCalculator(): CostCalculator {
  if (!calculatorInstance) {
    calculatorInstance = new CostCalculator();
  }
  return calculatorInstance;
}

/**
 * 便捷函数：创建成本计算器
 */
export function createCostCalculator(): CostCalculator {
  return new CostCalculator();
}
