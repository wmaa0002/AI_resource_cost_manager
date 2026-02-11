/**
 * 成本汇总仪表盘组件
 * 展示总成本、分类统计和趋势图表
 */

import { useMemo } from 'react';
import type { CostSummary } from '@/types';
import { useCostStore, useCostStoreSelectors } from '@/hooks';
import { formatCurrency } from '@/lib/utils';

interface CostSummaryCardsProps {
  summary: CostSummary | null;
}

/**
 * 汇总卡片数据
 */
interface SummaryCardData {
  title: string;
  amount: number;
  currency: string;
  icon: string;
  color: string;
  description: string;
}

export function CostSummaryCards({ summary }: CostSummaryCardsProps) {
  const { defaultCurrency } = useCostStore();
  const { enabledCount, totalCount } = useCostStoreSelectors();

  // 计算汇总数据
  const cards = useMemo((): SummaryCardData[] => {
    if (!summary) {
      return [
        {
          title: '日成本',
          amount: 0,
          currency: defaultCurrency,
          icon: '📅',
          color: 'bg-red-500',
          description: '预估每日成本',
        },
        {
          title: '月成本',
          amount: 0,
          currency: defaultCurrency,
          icon: '📆',
          color: 'bg-blue-500',
          description: '预估每月成本',
        },
        {
          title: '年成本',
          amount: 0,
          currency: defaultCurrency,
          icon: '🗓️',
          color: 'bg-green-500',
          description: '预估每年成本',
        },
        {
          title: '成本源',
          amount: enabledCount,
          currency: '',
          icon: '📦',
          color: 'bg-purple-500',
          description: `已启用 ${enabledCount}/${totalCount} 个`,
        },
      ];
    }

    return [
      {
        title: '日成本',
        amount: summary.totalDailyCost,
        currency: defaultCurrency,
        icon: '📅',
        color: 'bg-red-500',
        description: '基于当前启用的成本源',
      },
      {
        title: '月成本',
        amount: summary.totalMonthlyCost,
        currency: defaultCurrency,
        icon: '📆',
        color: 'bg-blue-500',
        description: '基于当前启用的成本源',
      },
      {
        title: '年成本',
        amount: summary.totalYearlyCost,
        currency: defaultCurrency,
        icon: '🗓️',
        color: 'bg-green-500',
        description: '基于当前启用的成本源',
      },
      {
        title: '成本源',
        amount: summary.enabledSourcesCount,
        currency: '',
        icon: '📦',
        color: 'bg-purple-500',
        description: `已启用 ${summary.enabledSourcesCount}/${summary.totalSourcesCount} 个`,
      },
    ];
  }, [summary, defaultCurrency, enabledCount, totalCount]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <div className="mt-2 flex items-baseline gap-1">
                {card.currency ? (
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(card.amount, card.currency)}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {card.amount}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">{card.description}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.color}`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 成本分布饼图组件
 */
interface CostDistributionProps {
  byProvider: Record<string, number>;
  byType: Record<string, number>;
}

export function CostDistribution({ byProvider, byType }: CostDistributionProps) {
  // 颜色配置
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-pink-500',
  ];

  // Provider 数据
  const providerEntries = Object.entries(byProvider);
  const maxProvider = providerEntries.reduce(
    (max, [_, value]) => (value > max ? value : max),
    0
  );

  // Type 数据
  const typeLabels: Record<string, string> = {
    api: 'API 调用',
    subscription: '订阅服务',
    hardware: '硬件',
    'one-time': '一次性',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 按 Provider 分布 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">按 Provider 分布</h3>
        {providerEntries.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {providerEntries.map(([provider, cost], index) => {
              const percentage = maxProvider > 0 ? (cost / maxProvider) * 100 : 0;
              return (
                <div key={provider}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {provider || '自定义'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(cost, 'CNY')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[index % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 按类型分布 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">按类型分布</h3>
        {Object.entries(byType).length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byType).map(([type, cost], index) => {
              const total = Object.values(byType).reduce((sum, v) => sum + v, 0);
              const percentage = total > 0 ? (cost / total) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {typeLabels[type] || type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(cost, 'CNY')} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[index % colors.length]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 月度趋势组件
 */
interface MonthlyTrendProps {
  data: Array<{ month: string; cost: number }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendProps) {
  const maxCost = Math.max(...data.map((d) => d.cost), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">月度趋势</h3>
      {data.length === 0 ? (
        <p className="text-gray-400 text-center py-8">暂无数据</p>
      ) : (
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = (item.cost / maxCost) * 100;
            const [year, month] = item.month.split('-');
            const monthName = `${month}月`;

            return (
              <div key={item.month} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-16">{monthName}</span>
                <div className="flex-1">
                  <div className="w-full bg-gray-100 rounded-full h-6 relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {formatCurrency(item.cost, 'CNY')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * 成本仪表盘主组件
 */
export function CostDashboard() {
  const { costSummary, sources } = useCostStore();

  // 当没有汇总数据时，使用所有启用的成本源计算
  const summary = costSummary;

  return (
    <div className="space-y-6">
      {/* 汇总卡片 */}
      <CostSummaryCards summary={summary} />

      {/* 成本分布 */}
      <CostDistribution
        byProvider={summary?.costByProvider || {}}
        byType={summary?.costByType || {}}
      />

      {/* 月度趋势 */}
      <MonthlyTrendChart data={summary?.monthlyTrend || []} />
    </div>
  );
}
