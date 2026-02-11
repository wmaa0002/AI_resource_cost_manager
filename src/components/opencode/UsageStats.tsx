/**
 * API 用量统计组件
 * 显示各 Provider 的 Token 用量和成本
 */

import { useState, useEffect } from 'react';
import { useProviderConfig, useUsageData } from '@/hooks';
import { formatNumber, formatCurrency, getFromStorage, saveToStorage } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui';
import type { Currency } from '@/types';

interface UsageStatsProps {
  onRefresh?: () => void;
}

// 支持的货币列表
const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
];

// 存储键
const CURRENCY_STORAGE_KEY = 'usage-stats:currency';

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

// Token 价格参考（以 USD 为基准）
const TOKEN_PRICES = [
  { provider: 'OpenAI GPT-4', inputPerM: 30, outputPerM: 60 },
  { provider: 'Claude 3', inputPerM: 3, outputPerM: 15 },
  { provider: 'OpenCode', inputPerM: 0.5, outputPerM: 1.5 },
  { provider: 'Gemini', inputPerM: 0.125, outputPerM: 0.5 },
];

/**
 * 货币汇率（相对于 USD）
 */
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  CNY: 7.24,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  KRW: 1320,
  AUD: 1.53,
  CAD: 1.36,
};

/**
 * 用量统计卡片
 */
function UsageCard({
  provider,
  usage,
  pricing,
  currency,
}: {
  provider: string;
  usage: { inputTokens: number; outputTokens: number; cost: number };
  pricing?: { inputPerM: number; outputPerM: number };
  currency: Currency;
}) {
  const icon = PROVIDER_ICONS[provider.toLowerCase()] || '📊';
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  // 计算当前货币的成本
  const exchangeRate = EXCHANGE_RATES[currency] || 1;
  const convertedCost = usage.cost * exchangeRate;

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
            {formatCurrency(convertedCost, currency)}
          </p>
        </div>
        {pricing && (
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {formatCurrency(pricing.inputPerM * exchangeRate, currency)}/M / {formatCurrency(pricing.outputPerM * exchangeRate, currency)}/M
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function UsageStats({ onRefresh }: UsageStatsProps) {
  const { configs } = useProviderConfig();
  const { data: usageData, loading, fetchUsage, refresh } = useUsageData();

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('CNY');
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);

  // 加载保存的货币设置
  useEffect(() => {
    const savedCurrency = getFromStorage<Currency>(CURRENCY_STORAGE_KEY, 'CNY');
    setSelectedCurrency(savedCurrency);
  }, []);

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

  // 保存货币设置
  const handleSaveCurrency = () => {
    saveToStorage(CURRENCY_STORAGE_KEY, selectedCurrency);
    setShowCurrencySelector(false);
  };

  // 获取当前货币符号
  const getCurrencySymbol = (currency: Currency) => {
    const curr = CURRENCIES.find(c => c.code === currency);
    return curr?.symbol || currency;
  };

  // 获取当前货币名称
  const getCurrencyName = (currency: Currency) => {
    const curr = CURRENCIES.find(c => c.code === currency);
    return curr?.name || currency;
  };

  // 计算汇率后的价格
  const getConvertedPrice = (usdPrice: number, currency: Currency) => {
    const exchangeRate = EXCHANGE_RATES[currency] || 1;
    return usdPrice * exchangeRate;
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCurrencySelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span>{getCurrencySymbol(selectedCurrency)}</span>
            <span>{getCurrencyName(selectedCurrency)}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
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
      </div>

      {/* 货币选择弹窗 */}
      {showCurrencySelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">选择货币</h3>
              <button
                onClick={() => setShowCurrencySelector(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => setSelectedCurrency(currency.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                    selectedCurrency === currency.code
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currency.symbol}</span>
                    <span className="font-medium text-gray-900">{currency.name}</span>
                    <span className="text-gray-500">({currency.code})</span>
                  </div>
                  {selectedCurrency === currency.code && (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowCurrencySelector(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCurrency}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-blue-100 text-sm mb-1">总成本 ({getCurrencyName(selectedCurrency)})</p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalUsage.cost * EXCHANGE_RATES[selectedCurrency], selectedCurrency)}
            </p>
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
                  ? { inputPerM: 30, outputPerM: 60 }
                  : provider === 'anthropic'
                  ? { inputPerM: 3, outputPerM: 15 }
                  : undefined
              }
              currency={selectedCurrency}
            />
          ))}
        </div>
      )}

      {/* Token 价格参考 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          💰 Token 价格参考 (每百万 Token, {getCurrencyName(selectedCurrency)})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {TOKEN_PRICES.map((price) => (
            <div key={price.provider} className="flex items-center gap-2">
              <span className="text-gray-400">
                {price.provider === 'OpenAI GPT-4' ? '🟢' :
                 price.provider === 'Claude 3' ? '🟡' :
                 price.provider === 'OpenCode' ? '🔵' : '🔴'}
              </span>
              <span className="text-gray-600">{price.provider}:</span>
              <span className="font-medium text-black">
                {formatCurrency(getConvertedPrice(price.inputPerM, selectedCurrency), selectedCurrency)} / {formatCurrency(getConvertedPrice(price.outputPerM, selectedCurrency), selectedCurrency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
