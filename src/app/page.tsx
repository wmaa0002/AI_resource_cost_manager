/**
 * 主页面 - AI 成本追踪器
 */

'use client';

import { useEffect, useState } from 'react';
import { useCostStore, useProviderConfig } from '@/hooks';
import { CostDashboard } from '@/components/dashboard';
import { CostSourceList } from '@/components/custom-cost';
import { ProviderConfigForm, UsageStats } from '@/components/opencode';
import type { ProviderConfig } from '@/types';

type TabType = 'overview' | 'usage' | 'providers' | 'sources';

// Provider 列表
const PROVIDERS = [
  // 国际厂商
  { id: 'opencode', name: 'OpenCode', baseUrl: 'https://api.opencode.ai/v1' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1' },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
  { id: 'azure', name: 'Azure OpenAI', baseUrl: '' },
  // 中国厂商
  { id: 'qwen', name: '通义千问 (Qwen)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { id: 'volcengine', name: '火山引擎 (Volcengine)', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3' },
  { id: 'minimax', name: 'Minimax', baseUrl: 'https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains' },
  { id: 'zhipu', name: '智谱 AI (GLM)', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { id: 'moonshot', name: '月之暗面 (Kimi)', baseUrl: 'https://api.moonshot.cn/v1' },
  { id: 'hunyuan', name: '腾讯混元 (Hunyuan)', baseUrl: 'https://hunyuan.cn-shanghai.cloud.tencent.com/api/v3' },
  { id: 'yi', name: '零一万物 (Yi)', baseUrl: 'https://api.lingyiwanwu.com/v1' },
  { id: 'tongyi', name: '阿里百炼', baseUrl: 'https://bailian.console.aliyun.com/openapi/api/v1' },
  { id: 'baichuan', name: '百川智能', baseUrl: 'https://api.baichuan.com/v1' },
  { id: 'spark', name: '讯飞星火', baseUrl: 'https://spark-api.xf-yun.com/v1' },
];

export default function HomePage() {
  const { recalculateSummary } = useCostStore();
  const { configs, deleteConfig, toggleEnabled } = useProviderConfig();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | undefined>();

  // 初始化时计算汇总
  useEffect(() => {
    recalculateSummary();
  }, [recalculateSummary]);

  // Tab 配置
  const tabs = [
    { id: 'overview' as TabType, label: '概览', icon: '📊' },
    { id: 'usage' as TabType, label: '用量统计', icon: '📈' },
    { id: 'providers' as TabType, label: 'API 配置', icon: '🔌' },
    { id: 'sources' as TabType, label: '成本源', icon: '💰' },
  ];

  // 渲染 Tab 内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">成本概览</h2>
              <CostDashboard />
            </section>
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">最近成本源</h2>
              </div>
              <CostSourceList />
            </section>
          </div>
        );
      case 'usage':
        return (
          <UsageStats onRefresh={recalculateSummary} />
        );
      case 'providers':
        return (
          <div className="space-y-6">
            {/* 头部 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Provider API 配置</h2>
                <p className="text-sm text-gray-500">管理你的 AI 服务商 API 凭证</p>
              </div>
              <button
                onClick={() => {
                  setEditingConfig(undefined);
                  setShowConfigForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加 Provider
              </button>
            </div>

            {/* Provider 列表 */}
            {configs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-4xl mb-4">🔌</div>
                <p className="text-gray-500 mb-2">暂无 Provider 配置</p>
                <p className="text-sm text-gray-400 mb-4">
                  添加你的第一个 Provider 来开始追踪 API 用量
                </p>
                <button
                  onClick={() => {
                    setEditingConfig(undefined);
                    setShowConfigForm(true);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  添加 Provider
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {configs.map((config) => {
                  const providerInfo = PROVIDERS.find(p => p.id === config.provider);
                  return (
                    <div
                      key={config.provider}
                      className={`bg-white rounded-xl shadow-sm border p-4 ${
                        config.isEnabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                            config.isEnabled ? 'bg-gray-100' : 'bg-gray-50'
                          }`}>
                            {providerInfo?.id === 'opencode' ? '🔵' :
                             providerInfo?.id === 'openai' ? '🟢' :
                             providerInfo?.id === 'anthropic' ? '🟡' :
                             providerInfo?.id === 'google' ? '🔴' :
                             providerInfo?.id === 'deepseek' ? '⚫' :
                             providerInfo?.id === 'azure' ? '🔷' :
                             providerInfo?.id === 'qwen' ? '🟠' :
                             providerInfo?.id === 'volcengine' ? '🟣' :
                             providerInfo?.id === 'minimax' ? '🟤' :
                             providerInfo?.id === 'zhipu' ? '🩵' :
                             providerInfo?.id === 'moonshot' ? '🌙' :
                             providerInfo?.id === 'hunyuan' ? '🦁' :
                             providerInfo?.id === 'yi' ? '☯️' :
                             providerInfo?.id === 'tongyi' ? '🏔️' :
                             providerInfo?.id === 'baichuan' ? '🌊' :
                             providerInfo?.id === 'spark' ? '✨' : '📊'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {providerInfo?.name || config.provider}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                config.isEnabled
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {config.isEnabled ? '已启用' : '已禁用'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {config.baseUrl || providerInfo?.baseUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEnabled(config.provider)}
                            className={`p-2 rounded-lg transition-colors ${
                              config.isEnabled
                                ? 'text-green-500 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={config.isEnabled ? '禁用' : '启用'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d={config.isEnabled
                                  ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  : "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setEditingConfig(config);
                              setShowConfigForm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定要删除此 Provider 配置吗？')) {
                                deleteConfig(config.provider);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'sources':
        return (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">成本源管理</h2>
              <CostSourceList />
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI 成本追踪</h1>
                <p className="text-sm text-gray-500">管理和分析你的 AI 成本</p>
              </div>
            </div>

            {/* 标签切换 */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* 移动端标签切换 */}
            <div className="md:hidden flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={tab.label}
                >
                  <span className="text-lg">{tab.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-400">
            AI 成本追踪器 © 2024
          </p>
        </div>
      </footer>

      {/* Provider 配置弹窗 */}
      {showConfigForm && (
        <ProviderConfigForm
          config={editingConfig}
          onClose={() => {
            setShowConfigForm(false);
            setEditingConfig(undefined);
          }}
          onSave={() => {
            setShowConfigForm(false);
            setEditingConfig(undefined);
            recalculateSummary();
          }}
        />
      )}
    </div>
  );
}
