/**
 * 成本源列表组件
 * 显示和管理所有成本源
 */

import { useState } from 'react';
import type { CostSource } from '@/types';
import { useCostStore, useCostStoreSelectors } from '@/hooks';
import { formatCurrency, formatDate, getRelativeTime } from '@/lib/utils';
import { CostSourceForm } from './CostSourceForm';

interface CostSourceListProps {
  onSelectionChange?: (ids: string[]) => void;
}

/**
 * 计费模式标签配置
 */
const BILLING_MODE_LABELS: Record<string, { label: string; color: string }> = {
  daily: { label: '每日', color: 'bg-red-100 text-red-700' },
  monthly: { label: '每月', color: 'bg-blue-100 text-blue-700' },
  yearly: { label: '每年', color: 'bg-green-100 text-green-700' },
  'one-time': { label: '一次性', color: 'bg-purple-100 text-purple-700' },
};

/**
 * 类型图标映射
 */
const TYPE_ICONS: Record<string, string> = {
  api: '🔌',
  subscription: '💳',
  hardware: '🖥️',
  'one-time': '🛒',
};

export function CostSourceList({ onSelectionChange }: CostSourceListProps) {
  const { sources, toggleSourceSelection, deleteSource, duplicateSource, deselectAll } = useCostStore();
  const { selectedIds, enabledCount, totalCount } = useCostStoreSelectors();

  const [editingSource, setEditingSource] = useState<CostSource | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'cost'>('date');

  // 筛选和排序
  const filteredSources = sources
    .filter((source) => {
      if (filter === 'enabled') return source.isEnabled;
      if (filter === 'disabled') return !source.isEnabled;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'cost':
          return b.cost - a.cost;
        case 'date':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  // 批量选择
  const handleSelectAll = () => {
    if (selectedIds.size === filteredSources.length) {
      deselectAll();
    } else {
      filteredSources.forEach((s) => {
        if (!selectedIds.has(s.id)) {
          toggleSourceSelection(s.id);
        }
      });
    }
    onSelectionChange?.(Array.from(selectedIds));
  };

  // 处理选择变化
  const handleSelectionChange = (id: string) => {
    toggleSourceSelection(id);
    onSelectionChange?.(Array.from(selectedIds));
  };

  // 复制成本源
  const handleDuplicate = (id: string) => {
    duplicateSource(id);
  };

  // 删除成本源
  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定要删除 "${name}" 吗？`)) {
      deleteSource(id);
    }
  };

  // 获取成本显示文本
  const getCostDisplay = (source: CostSource) => {
    const mode = BILLING_MODE_LABELS[source.billingMode];
    return `${formatCurrency(source.cost, source.currency)}/${mode.label.replace('每日', '').replace('每月', '').replace('每年', '').replace('一次性', '')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">成本源</h3>
          <p className="text-sm text-gray-500">
            已启用 {enabledCount} / {totalCount} 个成本源
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加成本源
        </button>
      </div>

      {/* 筛选和排序 */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">筛选:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black bg-white"
          >
            <option value="all">全部</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已禁用</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black bg-white"
          >
            <option value="date">更新时间</option>
            <option value="name">名称</option>
            <option value="cost">金额</option>
          </select>
        </div>

        <div className="flex-1" />

        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <input
            type="checkbox"
            checked={selectedIds.size === filteredSources.length && filteredSources.length > 0}
            readOnly
            className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
          />
          全选
        </button>
      </div>

      {/* 列表 */}
      {filteredSources.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-500 mb-4">暂无成本源</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-blue-500 hover:text-blue-600"
          >
            添加第一个成本源
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredSources.map((source) => {
            const mode = BILLING_MODE_LABELS[source.billingMode];
            const isSelected = selectedIds.has(source.id);

            return (
              <div
                key={source.id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  !source.isEnabled ? 'opacity-60' : ''
                }`}
              >
                {/* 选择框 */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectionChange(source.id)}
                  className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 flex-shrink-0"
                />

                {/* 类型图标 */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                  {TYPE_ICONS[source.type] || '💰'}
                </div>

                {/* 名称和描述 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {source.name}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${mode.color}`}>
                      {mode.label}
                    </span>
                  </div>
                  {source.description && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {source.description}
                    </p>
                  )}
                </div>

                {/* Provider */}
                {source.provider && (
                  <div className="text-sm text-gray-500 flex-shrink-0">
                    {source.provider}
                  </div>
                )}

                {/* 金额 */}
                <div className="text-right flex-shrink-0">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(source.cost, source.currency)}
                  </div>
                  <div className="text-xs text-gray-500">
                    /{source.billingMode === 'one-time' ? '一次性' : 
                      source.billingMode === 'daily' ? '天' : 
                      source.billingMode === 'monthly' ? '月' : '年'}
                  </div>
                </div>

                {/* 更新时间 */}
                <div className="text-sm text-gray-400 flex-shrink-0 w-20 text-right">
                  {getRelativeTime(source.updatedAt)}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingSource(source);
                      setShowForm(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDuplicate(source.id)}
                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                    title="复制"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDelete(source.id, source.name)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 添加/编辑表单模态框 */}
      {showForm && (
        <CostSourceForm
          source={editingSource || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingSource(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingSource(null);
          }}
        />
      )}
    </div>
  );
}
