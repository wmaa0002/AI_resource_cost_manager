/**
 * 用量趋势折线图组件
 */

'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailyUsage } from '@/lib/usage-api/types';
import { formatNumber, formatCurrency } from '@/lib/utils';
import type { Currency } from '@/types';

interface UsageLineChartProps {
  data: DailyUsage[];
  title: string;
  currency?: Currency;
  height?: number;
  showCost?: boolean;
}

// Provider 颜色配置
const PROVIDER_COLORS: Record<string, string> = {
  opencode: '#3b82f6',
  openai: '#22c55e',
  anthropic: '#eab308',
  google: '#ef4444',
  deepseek: '#6b7280',
  azure: '#3b82f6',
  qwen: '#f97316',
  volcengine: '#a855f7',
  minimax: '#8b5cf6',
  zhipu: '#06b6d4',
  moonshot: '#fde047',
  hunyuan: '#84cc16',
  yi: '#14b8a6',
  tongyi: '#64748b',
  baichuan: '#f43f5e',
  spark: '#fbbf24',
};

export function UsageLineChart({
  data,
  title,
  currency = 'USD',
  height = 300,
  showCost = true,
}: UsageLineChartProps) {
  // 转换数据格式用于图表
  const chartData = data.map((item) => ({
    date: item.date.slice(5), // 只显示 MM-DD
    inputTokens: item.inputTokens,
    outputTokens: item.outputTokens,
    cost: item.cost,
    totalTokens: item.inputTokens + item.outputTokens,
  }));

  // 按日期排序
  chartData.sort((a, b) => a.date.localeCompare(b.date));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div
          className="flex items-center justify-center text-gray-500"
          style={{ height }}
        >
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          {showCost && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => formatCurrency(value, currency)}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number | undefined, name: string | undefined) => {
              const numValue = value ?? 0;
              const label = name ?? '';
              if (label === 'cost') {
                return [formatCurrency(numValue, currency), '成本'];
              }
              return [formatNumber(numValue), label === 'inputTokens' ? '输入 Token' : label === 'outputTokens' ? '输出 Token' : '总 Token'];
            }}
            labelStyle={{ fontWeight: 600, color: '#374151' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                inputTokens: '输入 Token',
                outputTokens: '输出 Token',
                totalTokens: '总 Token',
                cost: '成本',
              };
              return labels[value] || value;
            }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="inputTokens"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#3b82f6' }}
            name="inputTokens"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="outputTokens"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#22c55e' }}
            name="outputTokens"
          />
          {showCost && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#f97316' }}
              name="cost"
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 多 Provider 用量对比图
 */
interface MultiProviderChartProps {
  providerData: Record<string, DailyUsage[]>;
  title: string;
  height?: number;
  currency?: Currency;
}

export function MultiProviderUsageChart({
  providerData,
  title,
  height = 350,
  currency = 'USD',
}: MultiProviderChartProps) {
  // 收集所有日期
  const allDates = new Set<string>();
  Object.values(providerData).forEach((data) => {
    data.forEach((item) => allDates.add(item.date));
  });

  // 转换数据格式
  const chartData = Array.from(allDates)
    .sort()
    .map((date) => {
      const item: Record<string, number | string> = { date: date.slice(5) };
      Object.entries(providerData).forEach(([provider, data]) => {
        const dayData = data.find((d) => d.date === date);
        if (dayData) {
          item[provider] = dayData.cost;
        } else {
          item[provider] = 0;
        }
      });
      return item;
    });

  const providers = Object.keys(providerData);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div
          className="flex items-center justify-center text-gray-500"
          style={{ height }}
        >
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => formatCurrency(value as number, currency)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number | undefined, name: string | undefined) => [
              formatCurrency(value ?? 0, currency),
              name ?? '',
            ]}
            labelStyle={{ fontWeight: 600, color: '#374151' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
          />
          {providers.map((provider) => (
            <Line
              key={provider}
              type="monotone"
              dataKey={provider}
              stroke={PROVIDER_COLORS[provider.toLowerCase()] || '#6b7280'}
              strokeWidth={2}
              dot={{ fill: PROVIDER_COLORS[provider.toLowerCase()] || '#6b7280', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name={provider}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
