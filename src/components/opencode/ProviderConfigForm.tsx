/**
 * Provider API 配置表单组件
 */

import { useState } from 'react';
import type { ProviderConfig } from '@/types';
import { useProviderConfig } from '@/hooks';
import { Input, Button, Switch } from '@/components/ui';

interface ProviderConfigFormProps {
  config?: ProviderConfig;
  onClose: () => void;
  onSave?: () => void;
}

// Provider 列表
const PROVIDERS = [
  // 国际厂商
  { id: 'opencode', name: 'OpenCode', baseUrl: 'https://api.opencode.ai/v1', category: '国际' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', category: '国际' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', category: '国际' },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1', category: '国际' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', category: '国际' },
  { id: 'azure', name: 'Azure OpenAI', baseUrl: '', category: '国际' },
  // 中国厂商
  { id: 'qwen', name: '通义千问 (Qwen)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', category: '国产' },
  { id: 'volcengine', name: '火山引擎 (Volcengine)', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', category: '国产' },
  { id: 'minimax', name: 'Minimax', baseUrl: 'https://api.minimax.chat/v1', category: '国产' },
  { id: 'zhipu', name: '智谱 AI (GLM)', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', category: '国产' },
  { id: 'moonshot', name: '月之暗面 (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', category: '国产' },
  { id: 'hunyuan', name: '腾讯混元 (Hunyuan)', baseUrl: 'https://hunyuan.cn-shanghai.cloud.tencent.com/api/v3', category: '国产' },
  { id: 'yi', name: '零一万物 (Yi)', baseUrl: 'https://api.lingyiwanwu.com/v1', category: '国产' },
  { id: 'tongyi', name: '阿里百炼', baseUrl: 'https://bailian.console.aliyun.com/openapi/api/v1', category: '国产' },
  { id: 'baichuan', name: '百川智能', baseUrl: 'https://api.baichuan.com/v1', category: '国产' },
  { id: 'spark', name: '讯飞星火', baseUrl: 'https://spark-api.xf-yun.com/v1', category: '国产' },
];

export function ProviderConfigForm({ config, onClose, onSave }: ProviderConfigFormProps) {
  const { saveConfig, testConnection, loading } = useProviderConfig();

  // 表单状态
  const [provider, setProvider] = useState(config?.provider || '');
  const [customProviderName, setCustomProviderName] = useState(config?.provider || '');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [isEnabled, setIsEnabled] = useState(config?.isEnabled ?? true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 判断是否是自定义 provider
  const isCustomProvider = provider === 'custom';

  // 获取实际使用的 provider ID
  const getActualProviderId = () => {
    if (isCustomProvider) {
      return `custom_${customProviderName.toLowerCase().replace(/\s+/g, '_')}`;
    }
    return provider;
  };

  // 获取选中的 Provider 默认配置
  const selectedProvider = PROVIDERS.find((p) => p.id === provider);

  // 按分类分组
  const providersByCategory = PROVIDERS.reduce((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = [];
    }
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof PROVIDERS>);

  // 验证表单
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!provider) {
      newErrors.provider = '请选择 Provider';
    }

    if (isCustomProvider && !customProviderName.trim()) {
      newErrors.customProviderName = '请输入 Provider 名称';
    }

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API Key 不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!validate()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const actualProviderId = getActualProviderId();
      const result = await testConnection(actualProviderId, apiKey, baseUrl || undefined);
      setTestResult({
        success: result.isValid,
        message: result.message,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '测试失败',
      });
    } finally {
      setTesting(false);
    }
  };

  // 保存配置
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const actualProviderId = getActualProviderId();

    const result = await saveConfig({
      provider: actualProviderId,
      apiKey,
      baseUrl: baseUrl || selectedProvider?.baseUrl || '',
      isEnabled,
    });

    if (result.isValid) {
      onSave?.();
      onClose();
    } else {
      setTestResult({
        success: false,
        message: result.message,
      });
    }
  };

  // 当选择 Provider 时自动填充 Base URL
  const handleProviderChange = (value: string) => {
    setProvider(value);
    if (value !== 'custom') {
      const p = PROVIDERS.find((prov) => prov.id === value);
      if (p && !baseUrl) {
        setBaseUrl(p.baseUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {config ? '编辑 Provider 配置' : '添加 Provider 配置'}
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
          {/* Provider 选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black bg-white ${
                errors.provider ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">请选择 Provider</option>
              {Object.entries(providersByCategory).map(([category, providers]) => (
                <optgroup key={category} label={category}>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="custom">🔧 自定义 Provider</option>
            </select>
            {errors.provider && <p className="mt-1 text-sm text-red-500">{errors.provider}</p>}
          </div>

          {/* 自定义 Provider 名称 */}
          {isCustomProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider 名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customProviderName}
                onChange={(e) => setCustomProviderName(e.target.value)}
                placeholder="输入自定义 Provider 名称"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black placeholder-gray-400 ${
                  errors.customProviderName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.customProviderName && (
                <p className="mt-1 text-sm text-red-500">{errors.customProviderName}</p>
              )}
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入你的 API Key"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black placeholder-gray-400 ${
                errors.apiKey ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.apiKey && <p className="mt-1 text-sm text-red-500">{errors.apiKey}</p>}
            <p className="mt-1 text-xs text-gray-400">
              {provider === 'openai' && 'OpenAI API Key 以 sk- 开头'}
              {provider === 'anthropic' && 'Anthropic API Key 以 sk-ant- 开头'}
              {provider === 'opencode' && 'OpenCode API Key'}
              {provider === 'qwen' && '阿里云百炼 API Key'}
              {provider === 'volcengine' && '火山引擎 API Key'}
              {provider === 'minimax' && 'Minimax API Key'}
              {provider === 'zhipu' && '智谱 AI API Key'}
              {provider === 'moonshot' && 'Kimi API Key'}
              {provider === 'hunyuan' && '腾讯云 API Key'}
              {provider === 'custom' && '请输入对应平台的 API Key'}
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base URL <span className="text-gray-400">(可选)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={selectedProvider?.baseUrl || (isCustomProvider ? '例如：https://api.example.com/v1' : '可选')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black placeholder-gray-400"
            />
            {isCustomProvider && (
              <p className="mt-1 text-xs text-gray-400">
                输入自定义 API 的基础 URL
              </p>
            )}
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
              {isEnabled ? '此 Provider 将参与用量统计' : '此 Provider 不参与用量统计'}
            </p>
          </div>

          {/* 测试连接结果 */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !provider || (isCustomProvider && !customProviderName) || !apiKey}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {testing ? '测试中...' : '测试连接'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
