/**
 * Provider 注册表
 * 管理所有已注册的 Provider，支持动态注册和获取
 */

import type {
  IProvider,
  ProviderRegistryInfo,
  ProviderConstructor,
  ProviderOptions,
  ProviderMetadata,
} from './types';
import { generateId } from '@/lib/utils';

/**
 * Provider 注册表类
 */
class ProviderRegistry {
  private providers: Map<string, ProviderRegistryInfo> = new Map();
  private instances: Map<string, IProvider> = new Map();
  private defaultProvider: string | null = null;

  /**
   * 注册 Provider
   * @param info - Provider 注册信息
   */
  register(info: ProviderRegistryInfo): void {
    if (this.providers.has(info.name)) {
      console.warn(`Provider "${info.name}" 已存在，将被覆盖`);
    }

    this.providers.set(info.name, info);

    if (!this.defaultProvider) {
      this.defaultProvider = info.name;
    }

    console.log(`Provider "${info.name}" (${info.displayName}) 已注册`);
  }

  /**
   * 注销 Provider
   * @param name - Provider 名称
   */
  unregister(name: string): void {
    if (!this.providers.has(name)) {
      console.warn(`Provider "${name}" 未注册`);
      return;
    }

    this.providers.delete(name);
    this.instances.delete(name);

    if (this.defaultProvider === name) {
      const remaining = this.providers.keys().next().value;
      this.defaultProvider = remaining || null;
    }

    console.log(`Provider "${name}" 已注销`);
  }

  /**
   * 获取 Provider 实例
   * @param name - Provider 名称
   * @param apiKey - API Key
   * @param options - Provider 选项
   * @returns Provider 实例
   */
  getProvider(
    name: string,
    apiKey?: string,
    options?: ProviderOptions
  ): IProvider {
    const instanceKey = `${name}:${apiKey || 'default'}`;

    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey)!;
    }

    const info = this.providers.get(name);
    if (!info) {
      throw new Error(`Provider "${name}" 未注册`);
    }

    const instance = new info.constructor(apiKey || '', options);
    this.instances.set(instanceKey, instance);

    return instance;
  }

  /**
   * 获取所有已注册的 Provider 名称
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取所有 Provider 的元信息
   */
  listProviderMetadata(): ProviderMetadata[] {
    return Array.from(this.providers.values()).map((info) => ({
      name: info.name,
      displayName: info.displayName,
      description: this.getProviderDescription(info.name),
      website: this.getProviderWebsite(info.name),
      logoUrl: this.getProviderLogo(info.name),
      documentationUrl: this.getProviderDocumentation(info.name),
    }));
  }

  /**
   * 获取默认 Provider 名称
   */
  getDefaultProviderName(): string | null {
    return this.defaultProvider;
  }

  /**
   * 设置默认 Provider
   * @param name - Provider 名称
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" 未注册`);
    }
    this.defaultProvider = name;
  }

  /**
   * 检查 Provider 是否已注册
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * 获取 Provider 的功能支持信息
   */
  getProviderFeatures(name: string) {
    const info = this.providers.get(name);
    if (!info) {
      throw new Error(`Provider "${name}" 未注册`);
    }
    return info.features;
  }

  /**
   * 清空所有注册和实例
   */
  clear(): void {
    this.providers.clear();
    this.instances.clear();
    this.defaultProvider = null;
  }

  /**
   * 静态方法：创建带缓存的 Provider 实例
   */
  static createInstance(
    name: string,
    apiKey: string,
    options?: ProviderOptions
  ): IProvider {
    const registry = getProviderRegistry();
    return registry.getProvider(name, apiKey, options);
  }

  // 私有辅助方法
  private getProviderDescription(name: string): string {
    const descriptions: Record<string, string> = {
      opencode: 'OpenCode AI 模型提供商',
      openai: 'OpenAI GPT 模型提供商',
      anthropic: 'Anthropic Claude 模型提供商',
      google: 'Google Gemini 模型提供商',
    };
    return descriptions[name] || '';
  }

  private getProviderWebsite(name: string): string | undefined {
    const websites: Record<string, string> = {
      opencode: 'https://opencode.ai',
      openai: 'https://openai.com',
      anthropic: 'https://anthropic.com',
      google: 'https://cloud.google.com',
    };
    return websites[name];
  }

  private getProviderLogo(name: string): string | undefined {
    const logos: Record<string, string> = {
      opencode: '/logos/opencode.svg',
      openai: '/logos/openai.svg',
      anthropic: '/logos/anthropic.svg',
      google: '/logos/google.svg',
    };
    return logos[name];
  }

  private getProviderDocumentation(name: string): string | undefined {
    const docs: Record<string, string> = {
      opencode: 'https://docs.opencode.ai',
      openai: 'https://platform.openai.com/docs',
      anthropic: 'https://docs.anthropic.com',
      google: 'https://ai.google.dev/docs',
    };
    return docs[name];
  }
}

/**
 * Provider 注册表单例
 */
let registryInstance: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!registryInstance) {
    registryInstance = new ProviderRegistry();
  }
  return registryInstance;
}

/**
 * 注册 Provider 辅助函数
 */
export function registerProvider(info: ProviderRegistryInfo): void {
  getProviderRegistry().register(info);
}

/**
 * 获取 Provider 实例辅助函数
 */
export function getProvider(
  name: string,
  apiKey?: string,
  options?: ProviderOptions
): IProvider {
  return getProviderRegistry().getProvider(name, apiKey, options);
}

/**
 * 列出所有 Provider 辅助函数
 */
export function listProviders(): string[] {
  return getProviderRegistry().listProviders();
}

/**
 * Provider 注册装饰器
 */
export function Provider(
  metadata: Omit<ProviderRegistryInfo, 'constructor'>
) {
  return function <T extends ProviderConstructor>(constructor: T): T {
    registerProvider({
      ...metadata,
      constructor,
    });
    return constructor;
  };
}
