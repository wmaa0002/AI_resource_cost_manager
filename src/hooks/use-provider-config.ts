/**
 * Provider 配置管理 Hook
 * 管理 Provider API 配置的 CRUD 操作
 */

import { useState, useCallback, useEffect } from 'react';
import type { ProviderConfig } from '@/types';
import type { ProviderValidationResult } from '@/lib/provider/types';
import {
  getProviderRegistry,
  getProvider,
  listProviders,
} from '@/lib/provider/registry';
import {
  validateProviderConfig,
  testProviderConnection,
} from '@/lib/validators';
import {
  getFromStorage,
  saveToStorage,
  generateId,
} from '@/lib/utils';
import { STORAGE_KEYS } from '@/types';

/**
 * Provider 配置状态
 */
interface ProviderConfigState {
  configs: ProviderConfig[];
  activeProvider: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Provider 配置 Hook 返回值
 */
interface UseProviderConfigReturn extends ProviderConfigState {
  saveConfig: (config: ProviderConfig) => Promise<ProviderValidationResult>;
  deleteConfig: (provider: string) => void;
  getConfig: (provider: string) => ProviderConfig | null;
  setActiveProvider: (provider: string | null) => void;
  testConnection: (
    provider: string,
    apiKey: string,
    baseUrl?: string
  ) => Promise<ProviderValidationResult>;
  availableProviders: string[];
  isConfigValid: (provider: string) => boolean;
  toggleEnabled: (provider: string) => void;
  refreshConfigs: () => void;
}

/**
 * Provider 配置 Hook
 */
export function useProviderConfig(): UseProviderConfigReturn {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [activeProvider, setActiveProviderState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化加载配置
  useEffect(() => {
    try {
      const savedConfigs = getFromStorage<ProviderConfig[]>(
        STORAGE_KEYS.CONFIG,
        []
      );
      setConfigs(savedConfigs);

      const active = savedConfigs.find((c) => c.isEnabled);
      if (active) {
        setActiveProviderState(active.provider);
      }
    } catch (err) {
      setError('加载配置失败');
      console.error('Failed to load provider configs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存配置
  const saveConfig = useCallback(
    async (config: ProviderConfig): Promise<ProviderValidationResult> => {
      setLoading(true);
      setError(null);

      try {
        // 验证配置格式
        const validation = validateProviderConfig(config);
        if (!validation.isValid) {
          setLoading(false);
          return {
            isValid: false,
            message: validation.errors.join('; '),
          };
        }

        // 测试连接
        const connectionResult = await testProviderConnection(
          config.provider,
          config.apiKey,
          config.baseUrl
        );

        if (!connectionResult.isValid) {
          setLoading(false);
          return connectionResult;
        }

        // 保存到状态和存储
        setConfigs((prev) => {
          const existing = prev.findIndex((c) => c.provider === config.provider);
          const updatedConfigs = [...prev];

          if (existing >= 0) {
            updatedConfigs[existing] = {
              ...config,
              updatedAt: new Date().toISOString(),
            };
          } else {
            updatedConfigs.push({
              ...config,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          saveToStorage(STORAGE_KEYS.CONFIG, updatedConfigs);
          return updatedConfigs;
        });

        // 如果启用了这个配置，设置它为活跃 Provider
        if (config.isEnabled) {
          setActiveProviderState(config.provider);
        }

        setLoading(false);
        return {
          isValid: true,
          message: '配置保存成功',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : '保存配置失败';
        setError(message);
        setLoading(false);
        return {
          isValid: false,
          message,
        };
      }
    },
    []
  );

  // 删除配置
  const deleteConfig = useCallback((provider: string) => {
    setConfigs((prev) => {
      const filtered = prev.filter((c) => c.provider !== provider);
      saveToStorage(STORAGE_KEYS.CONFIG, filtered);
      return filtered;
    });

    if (activeProvider === provider) {
      setActiveProviderState(null);
    }
  }, [activeProvider]);

  // 获取配置
  const getConfig = useCallback((provider: string): ProviderConfig | null => {
    return configs.find((c) => c.provider === provider) || null;
  }, [configs]);

  // 设置活跃 Provider
  const setActiveProvider = useCallback((provider: string | null) => {
    setActiveProviderState(provider);

    // 更新配置的启用状态
    setConfigs((prev) => {
      const updated = prev.map((c) => ({
        ...c,
        isEnabled: c.provider === provider,
        updatedAt: new Date().toISOString(),
      }));
      saveToStorage(STORAGE_KEYS.CONFIG, updated);
      return updated;
    });
  }, []);

  // 测试连接
  const testConnection = useCallback(
    async (
      provider: string,
      apiKey: string,
      baseUrl?: string
    ): Promise<ProviderValidationResult> => {
      return testProviderConnection(provider, apiKey, baseUrl);
    },
    []
  );

  // 获取可用的 Provider 列表
  const availableProviders = listProviders();

  // 检查配置是否有效
  const isConfigValid = useCallback(
    (provider: string): boolean => {
      const config = getConfig(provider);
      if (!config) return false;

      const validation = validateProviderConfig(config);
      return validation.isValid;
    },
    [getConfig]
  );

  // 切换配置的启用状态
  const toggleEnabled = useCallback((provider: string) => {
    setConfigs((prev) => {
      const updated = prev.map((c) => {
        if (c.provider === provider) {
          const newEnabled = !c.isEnabled;
          return {
            ...c,
            isEnabled: newEnabled,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      saveToStorage(STORAGE_KEYS.CONFIG, updated);
      return updated;
    });
  }, []);

  // 刷新配置列表
  const refreshConfigs = useCallback(() => {
    try {
      const savedConfigs = getFromStorage<ProviderConfig[]>(
        STORAGE_KEYS.CONFIG,
        []
      );
      setConfigs(savedConfigs);

      const active = savedConfigs.find((c) => c.isEnabled);
      setActiveProviderState(active?.provider || null);
    } catch (err) {
      setError('刷新配置失败');
      console.error('Failed to refresh provider configs:', err);
    }
  }, []);

  return {
    configs,
    activeProvider,
    loading,
    error,
    saveConfig,
    deleteConfig,
    getConfig,
    setActiveProvider,
    testConnection,
    availableProviders,
    isConfigValid,
    toggleEnabled,
    refreshConfigs,
  };
}

/**
 * 使用 Provider 实例的 Hook
 * @param provider - Provider 名称
 * @returns Provider 实例
 */
export function useProviderInstance(provider: string) {
  const { getConfig } = useProviderConfig();
  const config = getConfig(provider);

  if (!config) {
    return null;
  }

  try {
    return getProvider(provider, config.apiKey, {
      baseUrl: config.baseUrl,
    });
  } catch {
    console.error(`Failed to create provider instance: ${provider}`);
    return null;
  }
}
