/**
 * API 用量统计组件
 * 显示各 Provider 的 Token 用量和成本
 */

import { useState, useEffect } from 'react';
import { useProviderConfig, useUsageData } from '@/hooks';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui';

interface UsageStatsProps {
  onRefresh?: () => void;
}

/**
 * Provider 图标映射
 */
const PROVIDER_ICONS: Record<string, string> = {
  opencode: '🔵',
  openai: '🟢',
  anthropic: '🟡',
  google: '🔴',
  deepseek: '⚫',
  azure: '🔷',
};

/**
 * 用量统计卡片
 */
function UsageCard({
  provider,
  usage,
  pricing,
}: {
  provider: string;
  usage: { inputTokens: number; outputTokens: number; cost: number };
  pricing?: { inputPerM: number; outputPerM: number };
}) {
  const icon = PROVIDER_ICONS[provider.toLowerCase()] || '📊';
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{providerName}</h4>
          <p className="text-xs text-gray-500">{provider}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">输入 Token</p>
          <p className="font-medium text-gray-900">{formatNumber(usage.inputTokens)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">输出 Token</p>
          <p className="font-medium text-gray-900">{formatNumber(usage.outputTokens)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">总成本</p>
          <p className="font-semibold text-lg text-blue-600">
            {formatCurrency(usage.cost, 'USD')}
          </p>
        </div>
        {pricing && (
          <div className="text-right">
            <p className="text-xs text-gray-500">
              ${pricing.inputPerM}/M / ${pricing.outputPerM}/M
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function UsageStats({ onRefresh }: UsageStatsProps) {
  const { configs, activeProvider, setActiveProvider } = useProviderConfig();
  const { data: usageData, loading, fetchUsage, refresh } = useUsageData();

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // 获取已启用的 Provider 配置
  const enabledConfigs = configs.filter((c) => c.isEnabled);

  // 按 Provider 分组统计用量
  const usageByProvider = enabledConfigs.reduce(
    (acc, config) => {
      const provider = config.provider.toLowerCase();
      if (!acc[provider]) {
        acc[provider] = {
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
        };
      }
      // 模拟数据（实际应从 API 获取）
      acc[provider] = {
        inputTokens: Math.floor(Math.random() * 100000) + 10000,
        outputTokens: Math.floor(Math.random() * 50000) + 5000,
        cost: Math.random() * 50 + 10,
      };
      return acc;
    },
    {} as Record<string, { inputTokens: number; outputTokens: number; cost: number }>
  );

  // 总计
  const totalUsage = Object.values(usageByProvider).reduce(
    (acc, curr) => ({
      inputTokens: acc.inputTokens + curr.inputTokens,
      outputTokens: acc.outputTokens + curr.outputTokens,
      cost: acc.cost + curr.cost,
    }),
    { inputTokens: 0, outputTokens: 0, cost: 0 }
  );

  // 刷新数据
  const handleRefresh = () => {
    refresh();
    onRefresh?.();
  };

  // 加载状态
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <LoadingSpinner text="加载用量数据..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API 用量统计</h3>
          <p className="text-sm text-gray-500">
            Token 用量和成本 ({dateRange.startDate} ~ {dateRange.endDate})
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
      </div>

      {/* 日期范围选择 */}
      <div className="flex items-center gap-4">
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
        />
        <span className="text-gray-400">至</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
        />
      </div>

      {/* 总计 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-blue-100 text-sm mb-1">输入 Token</p>
            <p className="text-2xl font-bold">{formatNumber(totalUsage.inputTokens)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">输出 Token</p>
            <p className="text-2xl font-bold">{formatNumber(totalUsage.outputTokens)}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">总成本</p>
            <p className="text-2xl font-bold">{formatCurrency(totalUsage.cost, 'USD')}</p>
          </div>
        </div>
      </div>

      {/* 各 Provider 用量卡片 */}
      {Object.keys(usageByProvider).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">🔌</div>
          <p className="text-gray-500 mb-4">暂无 API 配置</p>
          <p className="text-sm text-gray-400">
            请先添加 Provider API 配置以查看用量统计
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(usageByProvider).map(([provider, usage]) => (
            <UsageCard
              key={provider}
              provider={provider}
              usage={usage}
              pricing={
                provider === 'openai'
                  ? { inputPerM: 2.5, outputPerM: 10 }
                  : provider === 'anthropic'
                  ? { inputPerM: 3, outputPerM: 15 }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Token 价格参考 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">💰 Token 价格参考 (每百万 Token)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>🟢</span>
            <span className="text-gray-600">OpenAI GPT-4:</span>
            <span className="font-medium">$30 / $60</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🟡</span>
            <span className="text-gray-600">Claude 3:</span>
            <span className="font-medium">$3 / $15</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔵</span>
            <span className="text-gray-600">OpenCode:</span>
            <span className="font-medium">$0.5 / $1.5</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔴</span>
            <span className="text-gray-600">Gemini:</span>
            <span className="font-medium">$0.125 / $0.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
