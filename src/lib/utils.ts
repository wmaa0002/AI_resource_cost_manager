/**
 * 工具函数模块
 * 提供通用的工具函数供整个应用使用
 */

// ==================== 货币格式化 ====================

/**
 * 货币符号映射
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
};

/**
 * 货币格式化
 * @param amount - 金额
 * @param currency - 货币代码
 * @param locale - 本地化设置
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(
  amount: number,
  currency: 'CNY' | 'USD' | 'EUR' = 'CNY',
  locale: string = 'zh-CN'
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ==================== 数字格式化 ====================

/**
 * 数字格式化 (千分位)
 * @param num - 数字
 * @param decimals - 小数位数
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number, decimals?: number): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 20,
  }).format(num);
}

/**
 * 格式化百分比
 * @param value - 值 (0-1)
 * @param decimals - 小数位数
 * @returns 百分比字符串
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ==================== 日期处理 ====================

/**
 * 解析日期字符串为 Date 对象
 * @param dateStr - 日期字符串
 * @returns Date 对象
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) {
    return new Date();
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return date;
}

/**
 * 格式化日期为字符串
 * @param date - Date 对象或日期字符串
 * @param format - 格式模板
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string,
  format: string = 'YYYY-MM-DD'
): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取相对时间描述
 * @param date - 日期
 * @returns 相对时间描述
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin} 分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour} 小时前`;
  } else if (diffDay < 7) {
    return `${diffDay} 天前`;
  } else {
    return formatDate(d, 'YYYY-MM-DD');
  }
}

/**
 * 计算两个日期之间的天数
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 天数
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 获取某月的第一天
 * @param date - 日期
 * @returns 该月第一天的 Date 对象
 */
export function getFirstDayOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * 获取某月的最后一天
 * @param date - 日期
 * @returns 该月最后一天的 Date 对象
 */
export function getLastDayOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * 获取月份名称
 * @param date - 日期
 * @param locale - 本地化
 * @returns 月份名称
 */
export function getMonthName(date: Date | string, locale: string = 'zh-CN'): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return d.toLocaleDateString(locale, { month: 'long' });
}

// ==================== 函数工具 ====================

/**
 * 防抖函数
 * @param fn - 需要防抖的函数
 * @param delay - 延迟时间 (毫秒)
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param fn - 需要节流的函数
 * @param limit - 间隔时间 (毫秒)
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 一次性函数 (执行后锁定)
 * @param fn - 需要执行的函数
 * @returns 包装后的函数
 */
export function once<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let executed = false;
  let result: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    if (!executed) {
      executed = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

// ==================== ID 生成 ====================

/**
 * 生成唯一 ID
 * @param prefix - ID 前缀 (可选)
 * @returns 唯一 ID 字符串
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  const id = `${timestamp}-${randomPart}`;
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * 生成短 ID (8位)
 * @returns 短 ID 字符串
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ==================== JSON 处理 ====================

/**
 * 安全解析 JSON
 * @param jsonStr - JSON 字符串
 * @param fallback - 解析失败时的默认值
 * @returns 解析结果或默认值
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    if (!jsonStr) {
      return fallback;
    }
    return JSON.parse(jsonStr) as T;
  } catch {
    return fallback;
  }
}

/**
 * 安全字符串化 JSON
 * @param obj - 对象
 * @param fallback - 失败时的默认值
 * @returns 字符串或默认值
 */
export function safeJsonStringify<T>(obj: T, fallback: string = ''): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

// ==================== 数据验证 ====================

/**
 * 检查是否为正数
 * @param value - 值
 * @returns 是否为正数
 */
export function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * 检查是否为有效的日期字符串
 * @param dateStr - 日期字符串
 * @returns 是否为有效日期
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * 检查字符串是否为空
 * @param str - 字符串
 * @returns 是否为空
 */
export function isEmptyString(str: unknown): boolean {
  return typeof str !== 'string' || str.trim().length === 0;
}

// ==================== 数组处理 ====================

/**
 * 数组分组
 * @param array - 数组
 * @param keyFn - 分组键函数
 * @returns 分组后的对象
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 数组去重
 * @param array - 数组
 * @param keyFn - 去重键函数 (可选)
 * @returns 去重后的数组
 */
export function unique<T>(array: T[], keyFn?: (item: T) => unknown): T[] {
  if (keyFn) {
    const seen = new Set();
    return array.filter((item) => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  return [...new Set(array)];
}

// ==================== 对象处理 ====================

/**
 * 深层合并对象
 * @param target - 目标对象
 * @param sources - 源对象数组
 * @returns 合并后的对象
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) {
        Object.assign(target, { [key]: {} });
      }
      deepMerge(target[key] as object, source[key] as object);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * 移除对象中的空值
 * @param obj - 对象
 * @returns 移除空值后的对象
 */
export function removeEmptyValues<T extends object>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}

// ==================== 存储 ====================

/**
 * 从 localStorage 获取值
 * @param key - 键名
 * @param fallback - 默认值
 * @returns 值
 */
export function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? safeJsonParse(item, fallback) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 保存值到 localStorage
 * @param key - 键名
 * @param value - 值
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, safeJsonStringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
}

/**
 * 从 localStorage 删除值
 * @param key - 键名
 */
export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from localStorage: ${key}`, error);
  }
}
