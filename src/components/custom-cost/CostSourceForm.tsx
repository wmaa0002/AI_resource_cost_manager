/**
 * 成本源表单组件
 * 用于添加和编辑成本源
 */

import { useState, useEffect } from 'react';
import type { CostSource, CostSourceType, BillingMode, Currency } from '@/types';
import { useCostStore } from '@/hooks';
import { generateId } from '@/lib/utils';

interface CostSourceFormProps {
  source?: CostSource;
  onClose: () => void;
  onSave?: () => void;
}

/**
 * 计费模式选项
 */
const BILLING_MODE_OPTIONS: Array<{ value: BillingMode; label: string; icon: string }> = [
  { value: 'daily', label: '每日', icon: '📅' },
  { value: 'monthly', label: '每月', icon: '📆' },
  { value: 'yearly', label: '每年', icon: '🗓️' },
  { value: 'one-time', label: '一次性', icon: '💎' },
];

/**
 * 成本类型选项
 */
const COST_TYPE_OPTIONS: Array<{ value: CostSourceType; label: string; icon: string }> = [
  { value: 'api', label: 'API 调用', icon: '🔌' },
  { value: 'subscription', label: '订阅服务', icon: '💳' },
  { value: 'hardware', label: '硬件', icon: '🖥️' },
  { value: 'one-time', label: '一次性购买', icon: '🛒' },
];

/**
 * 货币选项
 */
const CURRENCY_OPTIONS: Array<{ value: Currency; label: string; symbol: string }> = [
  { value: 'CNY', label: '人民币', symbol: '¥' },
  { value: 'USD', label: '美元', symbol: '$' },
  { value: 'EUR', label: '欧元', symbol: '€' },
];

export function CostSourceForm({ source, onClose, onSave }: CostSourceFormProps) {
  const { addSource, updateSource } = useCostStore();

  // 表单状态
  const [name, setName] = useState('');
  const [type, setType] = useState<CostSourceType>('subscription');
  const [provider, setProvider] = useState('');
  const [billingMode, setBillingMode] = useState<BillingMode>('monthly');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState<Currency>('CNY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  // 验证状态
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (source) {
      setName(source.name);
      setType(source.type);
      setProvider(source.provider || '');
      setBillingMode(source.billingMode);
      setCost(source.cost.toString());
      setCurrency(source.currency);
      setStartDate(source.startDate || '');
      setEndDate(source.endDate || '');
      setDescription(source.description || '');
      setIsEnabled(source.isEnabled);
    } else {
      // 设置默认开始日期为今天
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [source]);

  // 验证表单
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '名称不能为空';
    } else if (name.length > 100) {
      newErrors.name = '名称不能超过100个字符';
    }

    if (!cost.trim()) {
      newErrors.cost = '金额不能为空';
    } else if (isNaN(parseFloat(cost)) || parseFloat(cost) <= 0) {
      newErrors.cost = '金额必须为正数';
    } else if (parseFloat(cost) > 9999999) {
      newErrors.cost = '金额超出限制';
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = '结束日期不能早于开始日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const sourceData = {
        name: name.trim(),
        type,
        provider: provider.trim() || undefined,
        billingMode,
        cost: parseFloat(cost),
        currency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        description: description.trim() || undefined,
        isEnabled,
      };

      if (source) {
        updateSource(source.id, sourceData);
      } else {
        addSource(sourceData);
      }

      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save cost source:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取选中计费模式的图标
  const getBillingModeIcon = (mode: BillingMode) => {
    return BILLING_MODE_OPTIONS.find((o) => o.value === mode)?.icon || '📅';
  };

  // 获取选中类型的图标
  const getTypeIcon = (t: CostSourceType) => {
    return COST_TYPE_OPTIONS.find((o) => o.value === t)?.icon || '💰';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {source ? '编辑成本源' : '添加成本源'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名称 <span className="text-red-500">*</span>
            </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Cursor Pro 订阅"
                maxLength={100}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black placeholder-gray-400 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* 类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <div className="grid grid-cols-2 gap-2">
              {COST_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    type === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Provider (可选) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider <span className="text-gray-400">(可选)</span>
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="例如：OpenAI、Anthropic"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black placeholder-gray-400"
            />
          </div>

          {/* 计费模式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              计费模式 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BILLING_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBillingMode(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    billingMode === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 金额 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                金额 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {CURRENCY_OPTIONS.find((c) => c.value === currency)?.symbol}
                </span>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max="9999999"
                  step="0.01"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black placeholder-gray-400 ${
                    errors.cost ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.cost && <p className="mt-1 text-sm text-red-500">{errors.cost}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">货币</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 日期范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期 <span className="text-gray-400">(可选)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束日期 <span className="text-gray-400">(可选)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述 <span className="text-gray-400">(可选)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加一些说明..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none text-black placeholder-gray-400"
            />
            <p className="mt-1 text-sm text-gray-400 text-right">
              {description.length}/500
            </p>
          </div>

          {/* 启用开关 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-6 rounded-full transition-colors ${
                isEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {isEnabled ? '启用' : '禁用'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {isEnabled ? '此成本源将参与成本统计' : '此成本源不参与成本统计'}
            </p>
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : source ? '保存修改' : '添加成本源'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
