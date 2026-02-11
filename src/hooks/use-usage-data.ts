/**
 * 用量数据 Hook
 * 获取和管理 API 使用量数据
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UsageParams } from '@/types/api';
import type { NormalizedUsage } from '@/lib/provider/types';
import { getProvider } from '@/lib/provider/registry';
import { createCostCalculator } from '@/lib/cost-calculator';
import { getFromStorage, saveToStorage, debounce } from '@/lib/utils';
import { STORAGE_KEYS } from '@/types';
import { useProviderConfig } from './use-provider-config';

/**
 * 缓存配置
 */
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟

/**
 * 用量数据状态
 */
interface UsageDataState {
  data: NormalizedUsage[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  cacheHit: boolean;
}

/**
 * 用量数据 Hook 返回值
 */
interface UseUsageDataReturn extends UsageDataState {
  fetchUsage: (params: UsageParams) => Promise<void>;
  refresh: () => Promise<void>;
  clearCache: () => void;
  getCachedData: (params: UsageParams) => NormalizedUsage[] | null;
}

/**
 * 用量数据 Hook
 */
export function useUsageData(): UseUsageDataReturn {
  const [data, setData] = useState<NormalizedUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  const cacheRef = useRef<Map<string, { data: NormalizedUsage[]; timestamp: number }>>(
    new Map()
  );

  // 从缓存获取数据
  const getCachedData = useCallback((params: UsageParams): NormalizedUsage[] | null => {
    const cacheKey = generateCacheKey(params);
    const cached = cacheRef.current.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    return null;
  }, []);

  // 生成缓存 Key
  const generateCacheKey = (params: UsageParams): string => {
    return `${params.startDate}-${params.endDate}-${params.modelId || 'all'}`;
  };

  // 获取用量数据
  const fetchUsage = useCallback(async (params: UsageParams) => {
    setLoading(true);
    setError(null);

    try {
      // 检查缓存
      const cached = getCachedData(params);
      if (cached) {
        setData(cached);
        setCacheHit(true);
        setLoading(false);
        return;
      }

      setCacheHit(false);

      // 获取 Provider 实例
      const provider = getProvider('opencode');
      if (!provider) {
        throw new Error('Provider 未初始化');
      }

      // 获取数据
      const usageData = await provider.fetchUsage(params);

      // 更新缓存
      const cacheKey = generateCacheKey(params);
      cacheRef.current.set(cacheKey, {
        data: usageData,
        timestamp: Date.now(),
      });

      // 保存到本地存储
      saveToStorage(STORAGE_KEYS.USAGE, usageData);

      setData(usageData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取用量数据失败';
      setError(message);
      console.error('Failed to fetch usage data:', err);

      // 尝试从本地存储加载
      const localData = getFromStorage<NormalizedUsage[]>(STORAGE_KEYS.USAGE, []);
      if (localData.length > 0) {
        setData(localData);
        setLastUpdated(getFromStorage<string>('last-sync', ''));
      }
    } finally {
      setLoading(false);
    }
  }, [getCachedData]);

  // 刷新数据
  const refresh = useCallback(async () => {
    cacheRef.current.clear();
    setLastUpdated(null);
    await fetchUsage({
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
    });
  }, [fetchUsage]);

  // 清除缓存
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setLastUpdated(null);
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    cacheHit,
    fetchUsage,
    refresh,
    clearCache,
    getCachedData,
  };
}

/**
 * 获取默认开始日期 (30天前)
 */
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
}

/**
 * 获取默认结束日期 (今天)
 */
function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 使用带 Provider 参数的用量数据 Hook
 */
export function useUsageDataWithProvider(provider: string) {
  const { configs } = useProviderConfig();
  const [params, setParams] = useState<UsageParams>({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
  });

  const {
    data,
    loading,
    error,
    lastUpdated,
    fetchUsage,
    refresh,
    clearCache,
  } = useUsageData();

  const config = configs.find((c) => c.provider === provider);

  useEffect(() => {
    if (config) {
      fetchUsage(params);
    }
  }, [config, params, fetchUsage]);

  const updateParams = useCallback((newParams: Partial<UsageParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    params,
    updateParams,
    refresh,
    clearCache,
  };
}

/**
 * 使用成本计算的 Hook
 */
export function useCostCalculation() {
  const { data, loading, error } = useUsageData();
  const calculator = createCostCalculator();

  const costs = {
    total: 0,
    byModel: {} as Record<string, number>,
    byDay: {} as Record<string, number>,
  };

  for (const item of data) {
    costs.total += item.cost;
    costs.byModel[item.modelName] =
      (costs.byModel[item.modelName] || 0) + item.cost;
    costs.byDay[item.date] = (costs.byDay[item.date] || 0) + item.cost;
  }

  return {
    costs,
    loading,
    error,
  };
}
