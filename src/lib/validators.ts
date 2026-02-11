/**
 * 验证器模块
 * 提供 API Key 验证、表单验证等功能
 */

import type { ProviderConfig } from '@/types';
import type { ProviderValidationResult } from './provider/types';

/**
 * API Key 验证规则
 */
export interface ApiKeyValidationRule {
  name: string;
  pattern: RegExp;
  message: string;
}

/**
 * Provider 验证配置
 */
export interface ProviderValidationConfig {
  provider: string;
  rules: ApiKeyValidationRule[];
  testConnection: (apiKey: string, baseUrl?: string) => Promise<boolean>;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * OpenCode API Key 验证规则
 */
const OPENCODE_RULES: ApiKeyValidationRule[] = [
  {
    name: 'minLength',
    pattern: /^.{8,}$/,
    message: 'API Key 长度至少为 8 个字符',
  },
  {
    name: 'noWhitespace',
    pattern: /^\S+$/,
    message: 'API Key 不能包含空格',
  },
];

/**
 * OpenAI API Key 验证规则
 */
const OPENAI_RULES: ApiKeyValidationRule[] = [
  {
    name: 'startsWithSk',
    pattern: /^sk-[a-zA-Z0-9]{20,}$/,
    message: 'API Key 必须以 sk- 开头',
  },
];

/**
 * Anthropic API Key 验证规则
 */
const ANTHROPIC_RULES: ApiKeyValidationRule[] = [
  {
    name: 'startsWithSkAnt',
    pattern: /^sk-ant-[a-zA-Z0-9-]{30,}$/,
    message: 'API Key 必须以 sk-ant- 开头',
  },
];

/**
 * 验证 API Key
 * @param apiKey - API Key
 * @param rules - 验证规则
 * @returns 验证结果
 */
export function validateApiKey(
  apiKey: string,
  rules: ApiKeyValidationRule[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.pattern.test(apiKey)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 获取 Provider 的验证规则
 * @param provider - Provider 名称
 * @returns 验证规则数组
 */
export function getProviderValidationRules(
  provider: string
): ApiKeyValidationRule[] {
  const rulesMap: Record<string, ApiKeyValidationRule[]> = {
    opencode: OPENCODE_RULES,
    openai: OPENAI_RULES,
    anthropic: ANTHROPIC_RULES,
  };

  return rulesMap[provider.toLowerCase()] || OPENCODE_RULES;
}

/**
 * 验证 Provider 配置
 * @param config - Provider 配置
 * @returns 验证结果
 */
export function validateProviderConfig(
  config: ProviderConfig
): ValidationResult {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push('Provider 名称不能为空');
  }

  if (!config.apiKey) {
    errors.push('API Key 不能为空');
  } else {
    const rules = getProviderValidationRules(config.provider);
    const result = validateApiKey(config.apiKey, rules);
    errors.push(...result.errors);
  }

  if (config.baseUrl && typeof config.baseUrl !== 'string') {
    errors.push('Base URL 必须是字符串');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 测试 Provider 连接
 * @param provider - Provider 名称
 * @param apiKey - API Key
 * @param baseUrl - Base URL (可选)
 * @returns 连接是否成功
 */
export async function testProviderConnection(
  provider: string,
  apiKey: string,
  baseUrl?: string
): Promise<ProviderValidationResult> {
  try {
    const response = await fetch(
      `${baseUrl || getDefaultBaseUrl(provider)}/health`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.ok) {
      return {
        isValid: true,
        message: '连接成功',
      };
    }

    if (response.status === 401) {
      return {
        isValid: false,
        message: 'API Key 无效',
        errorCode: 'UNAUTHORIZED',
      };
    }

    if (response.status === 429) {
      return {
        isValid: false,
        message: '请求过于频繁，请稍后再试',
        errorCode: 'RATE_LIMITED',
      };
    }

    return {
      isValid: false,
      message: `连接失败: ${response.statusText}`,
      errorCode: 'CONNECTION_FAILED',
    };
  } catch (error) {
    return {
      isValid: false,
      message:
        error instanceof Error && error.name === 'TimeoutError'
          ? '连接超时'
          : '无法连接到服务器',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * 获取 Provider 默认 Base URL
 * @param provider - Provider 名称
 * @returns Base URL
 */
export function getDefaultBaseUrl(provider: string): string {
  const urls: Record<string, string> = {
    opencode: 'https://api.opencode.ai/v1',
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    google: 'https://generativelanguage.googleapis.com/v1',
  };

  return urls[provider.toLowerCase()] || '';
}

/**
 * 批量验证配置
 * @param configs - 配置数组
 * @returns 无效的配置列表
 */
export function validateConfigs(
  configs: ProviderConfig[]
): Array<{ config: ProviderConfig; errors: string[] }> {
  const invalid: Array<{ config: ProviderConfig; errors: string[] }> = [];

  for (const config of configs) {
    const result = validateProviderConfig(config);
    if (!result.isValid) {
      invalid.push({ config, errors: result.errors });
    }
  }

  return invalid;
}

/**
 * 创建模拟连接测试函数
 * @param shouldSucceed - 是否应该成功
 * @param delay - 延迟时间 (毫秒)
 * @returns 连接测试函数
 */
export function createMockConnectionTest(
  shouldSucceed: boolean,
  delay: number = 1000
): (apiKey: string, baseUrl?: string) => Promise<ProviderValidationResult> {
  return async (): Promise<ProviderValidationResult> => {
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (shouldSucceed) {
      return {
        isValid: true,
        message: '连接成功（模拟）',
      };
    }

    return {
      isValid: false,
      message: '连接失败（模拟）',
      errorCode: 'MOCK_ERROR',
    };
  };
}

/**
 * 验证环境变量
 * @param envVars - 环境变量名列表
 * @returns 缺失的环境变量
 */
export function checkEnvironmentVariables(
  envVars: string[]
): { missing: string[]; values: Record<string, string | undefined> } {
  const missing: string[] = [];
  const values: Record<string, string | undefined> = {};

  for (const name of envVars) {
    const value = process.env[name];
    values[name] = value;

    if (!value) {
      missing.push(name);
    }
  }

  return { missing, values };
}

/**
 * 安全解密敏感数据 (前端模拟)
 * @param encrypted - 加密数据
 * @returns 解密后的数据
 */
export function decryptSensitiveData(encrypted: string): string {
  if (typeof window === 'undefined') {
    return encrypted;
  }

  try {
    const decoded = atob(encrypted);
    return decoded;
  } catch {
    return encrypted;
  }
}

/**
 * 安全加密敏感数据 (前端模拟)
 * @param data - 原始数据
 * @returns 加密后的数据
 */
export function encryptSensitiveData(data: string): string {
  if (typeof window === 'undefined') {
    return data;
  }

  try {
    return btoa(data);
  } catch {
    return data;
  }
}
