/**
 * 成本数据 Store Hook
 * 使用 Zustand 进行状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CostSource, CostSummary, BillingMode, CostSourceType } from '@/types';
import { createCostCalculator } from '@/lib/cost-calculator';
import { generateId } from '@/lib/utils';
import { STORAGE_KEYS } from '@/types';

/**
 * 成本 Store 状态
 */
interface CostStoreState {
  sources: CostSource[];
  selectedSourceIds: Set<string>;
  defaultCurrency: 'CNY' | 'USD' | 'EUR';
  costSummary: CostSummary | null;
}

/**
 * 成本 Store Actions
 */
interface CostStoreActions {
  // CRUD 操作
  addSource: (source: Omit<CostSource, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSource: (id: string, updates: Partial<CostSource>) => void;
  deleteSource: (id: string) => void;
  duplicateSource: (id: string) => string | null;

  // 选择操作
  toggleSourceSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setSelectedSources: (ids: string[]) => void;

  // 筛选操作
  filterByType: (type?: CostSourceType) => void;
  filterByBillingMode: (mode?: BillingMode) => void;
  filterByProvider: (provider?: string) => void;

  // 配置操作
  setDefaultCurrency: (currency: 'CNY' | 'USD' | 'EUR') => void;

  // 计算操作
  recalculateSummary: () => void;
  getEnabledSources: () => CostSource[];
  getSourceById: (id: string) => CostSource | undefined;

  // 批量操作
  bulkUpdateBillingMode: (ids: string[], mode: BillingMode) => void;
  bulkDelete: (ids: string[]) => void;
  bulkEnable: (ids: string[]) => void;
  bulkDisable: (ids: string[]) => void;

  // 导入导出
  importSources: (sources: CostSource[]) => void;
  exportSources: () => CostSource[];

  // 重置
  reset: () => void;
}

/**
 * 成本 Store
 */
export const useCostStore = create<CostStoreState & CostStoreActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      sources: [],
      selectedSourceIds: new Set(),
      defaultCurrency: 'CNY',
      costSummary: null,

      // 添加成本源
      addSource: (source) => {
        const id = generateId();
        const now = new Date().toISOString();

        set((state) => {
          const newSources = [
            ...state.sources,
            {
              ...source,
              id,
              createdAt: now,
              updatedAt: now,
            },
          ];

          return {
            sources: newSources,
          };
        });

        get().recalculateSummary();
        return id;
      },

      // 更新成本源
      updateSource: (id, updates) => {
        set((state) => {
          const newSources = state.sources.map((source) =>
            source.id === id
              ? { ...source, ...updates, updatedAt: new Date().toISOString() }
              : source
          );

          return {
            sources: newSources,
          };
        });

        get().recalculateSummary();
      },

      // 删除成本源
      deleteSource: (id) => {
        set((state) => {
          const newSources = state.sources.filter((s) => s.id !== id);
          const newSelected = new Set(state.selectedSourceIds);
          newSelected.delete(id);

          return {
            sources: newSources,
            selectedSourceIds: newSelected,
          };
        });

        get().recalculateSummary();
      },

      // 复制成本源
      duplicateSource: (id) => {
        const source = get().getSourceById(id);
        if (!source) return null;

        const newId = get().addSource({
          name: `${source.name} (副本)`,
          type: source.type,
          provider: source.provider,
          billingMode: source.billingMode,
          cost: source.cost,
          currency: source.currency,
          startDate: source.startDate,
          endDate: source.endDate,
          isEnabled: false,
          description: source.description,
        });

        return newId;
      },

      // 切换选择
      toggleSourceSelection: (id) => {
        set((state) => {
          const newSelected = new Set(state.selectedSourceIds);
          if (newSelected.has(id)) {
            newSelected.delete(id);
          } else {
            newSelected.add(id);
          }

          return {
            selectedSourceIds: newSelected,
          };
        });
      },

      // 全选
      selectAll: () => {
        set((state) => {
          return {
            selectedSourceIds: new Set(state.sources.map((s) => s.id)),
          };
        });
      },

      // 取消全选
      deselectAll: () => {
        set({
          selectedSourceIds: new Set(),
        });
      },

      // 设置选中
      setSelectedSources: (ids) => {
        set({
          selectedSourceIds: new Set(ids),
        });
      },

      // 筛选 (保留所有数据，仅供查询使用)
      filterByType: () => {
        // 在实际应用中，这里会返回过滤后的数据
        // 由于 Zustand 是响应式的，我们不在这里修改状态
      },

      filterByBillingMode: () => {},
      filterByProvider: () => {},

      // 设置默认货币
      setDefaultCurrency: (currency) => {
        set({ defaultCurrency: currency });
        get().recalculateSummary();
      },

      // 重新计算汇总
      recalculateSummary: () => {
        const calculator = createCostCalculator();
        const summary = calculator.calculateSummary(get().sources);
        set({ costSummary: summary });
      },

      // 获取启用的成本源
      getEnabledSources: () => {
        return get().sources.filter((s) => s.isEnabled);
      },

      // 根据 ID 获取成本源
      getSourceById: (id) => {
        return get().sources.find((s) => s.id === id);
      },

      // 批量更新计费模式
      bulkUpdateBillingMode: (ids, mode) => {
        set((state) => {
          const newSources = state.sources.map((source) =>
            ids.includes(source.id)
              ? { ...source, billingMode: mode, updatedAt: new Date().toISOString() }
              : source
          );

          return {
            sources: newSources,
          };
        });

        get().recalculateSummary();
      },

      // 批量删除
      bulkDelete: (ids) => {
        set((state) => {
          const newSources = state.sources.filter((s) => !ids.includes(s.id));
          const newSelected = new Set(
            Array.from(state.selectedSourceIds).filter((id) => !ids.includes(id))
          );

          return {
            sources: newSources,
            selectedSourceIds: newSelected,
          };
        });

        get().recalculateSummary();
      },

      // 批量启用
      bulkEnable: (ids) => {
        set((state) => {
          const newSources = state.sources.map((source) =>
            ids.includes(source.id)
              ? { ...source, isEnabled: true, updatedAt: new Date().toISOString() }
              : source
          );

          return {
            sources: newSources,
          };
        });

        get().recalculateSummary();
      },

      // 批量禁用
      bulkDisable: (ids) => {
        set((state) => {
          const newSources = state.sources.map((source) =>
            ids.includes(source.id)
              ? { ...source, isEnabled: false, updatedAt: new Date().toISOString() }
              : source
          );

          return {
            sources: newSources,
          };
        });

        get().recalculateSummary();
      },

      // 导入
      importSources: (sources) => {
        set((state) => {
          const newSources = sources.map((source) => ({
            ...source,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          return {
            sources: [...state.sources, ...newSources],
          };
        });

        get().recalculateSummary();
      },

      // 导出
      exportSources: () => {
        return get().sources;
      },

      // 重置
      reset: () => {
        set({
          sources: [],
          selectedSourceIds: new Set(),
          defaultCurrency: 'CNY',
          costSummary: null,
        });
      },
    }),
    {
      name: 'cost-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sources: state.sources,
        defaultCurrency: state.defaultCurrency,
      }),
    }
  )
);

/**
 * 选择器 Hook
 */
export function useCostStoreSelectors() {
  const sources = useCostStore((state) => state.sources);
  const selectedIds = useCostStore((state) => state.selectedSourceIds);
  const costSummary = useCostStore((state) => state.costSummary);

  const enabledSources = sources.filter((s) => s.isEnabled);
  const selectedSources = sources.filter((s) => selectedIds.has(s.id));

  return {
    allSources: sources,
    enabledSources,
    selectedSources,
    selectedIds,
    costSummary,
    enabledCount: enabledSources.length,
    selectedCount: selectedIds.size,
    totalCount: sources.length,
  };
}
