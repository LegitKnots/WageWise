/**
 * Safe data access utilities to prevent render errors
 */

// Safe property access with fallback
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  try {
    if (!obj || typeof obj !== 'object') return fallback;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return fallback;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : fallback;
  } catch (error) {
    console.warn('Safe access error:', error);
    return fallback;
  }
}

// Safe array access
export function safeArrayGet<T>(arr: T[] | null | undefined, index: number, fallback: T): T {
  try {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
      return fallback;
    }
    // Fix: always return T (not T | undefined)
    return (arr[index] !== undefined ? arr[index] : fallback);
  } catch (error) {
    console.warn('Safe array access error:', error);
    return fallback;
  }
}

// Safe function call
export function safeCall<T>(
  fn: (() => T) | null | undefined,
  fallback: T,
  ...args: any[]
): T {
  try {
    if (typeof fn !== 'function') return fallback;
    // Cast fn to a function that takes any arguments to fix the TS error
    return (fn as (...args: any[]) => T)(...args);
  } catch (error) {
    console.warn('Safe function call error:', error);
    return fallback;
  }
}

// Safe async function call
export async function safeAsyncCall<T>(
  fn: (() => Promise<T>) | null | undefined,
  fallback: T,
  ...args: any[]
): Promise<T> {
  try {
    if (typeof fn !== 'function') return fallback;
    // Cast fn to a function that takes any arguments to fix the TS error
    return await (fn as (...args: any[]) => Promise<T>)(...args);
  } catch (error) {
    console.warn('Safe async function call error:', error);
    return fallback;
  }
}

// Safe number conversion
export function safeNumber(value: any, fallback: number = 0): number {
  try {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  } catch (error) {
    console.warn('Safe number conversion error:', error);
    return fallback;
  }
}

// Safe string conversion
export function safeString(value: any, fallback: string = ''): string {
  try {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
  } catch (error) {
    console.warn('Safe string conversion error:', error);
    return fallback;
  }
}

// Safe date conversion
export function safeDate(value: any, fallback: Date = new Date()): Date {
  try {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? fallback : date;
    }
    return fallback;
  } catch (error) {
    console.warn('Safe date conversion error:', error);
    return fallback;
  }
}

// Safe boolean conversion
export function safeBoolean(value: any, fallback: boolean = false): boolean {
  try {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  } catch (error) {
    console.warn('Safe boolean conversion error:', error);
    return fallback;
  }
}

// Safe array operations
export function safeArray<T>(value: any, fallback: T[] = []): T[] {
  try {
    if (Array.isArray(value)) return value;
    return fallback;
  } catch (error) {
    console.warn('Safe array conversion error:', error);
    return fallback;
  }
}

// Safe object operations
export function safeObject<T extends Record<string, any>>(
  value: any,
  fallback: T = {} as T
): T {
  try {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    return fallback;
  } catch (error) {
    console.warn('Safe object conversion error:', error);
    return fallback;
  }
}

// Safe map function
export function safeMap<T, U>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => U,
  fallback: U[] = []
): U[] {
  try {
    if (!Array.isArray(array)) return fallback;
    return array.map(mapper);
  } catch (error) {
    console.warn('Safe map error:', error);
    return fallback;
  }
}

// Safe filter function
export function safeFilter<T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean,
  fallback: T[] = []
): T[] {
  try {
    if (!Array.isArray(array)) return fallback;
    return array.filter(predicate);
  } catch (error) {
    console.warn('Safe filter error:', error);
    return fallback;
  }
}

// Safe reduce function
export function safeReduce<T, U>(
  array: T[] | null | undefined,
  reducer: (acc: U, item: T, index: number) => U,
  initialValue: U,
  fallback: U = initialValue
): U {
  try {
    if (!Array.isArray(array)) return fallback;
    return array.reduce(reducer, initialValue);
  } catch (error) {
    console.warn('Safe reduce error:', error);
    return fallback;
  }
}

// Safe JSON parsing
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Safe JSON parse error:', error);
    return fallback;
  }
}

// Safe JSON stringify
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Safe JSON stringify error:', error);
    return fallback;
  }
}

// Safe AsyncStorage operations
export async function safeAsyncStorageGet<T>(
  key: string,
  fallback: T
): Promise<T> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const value = await AsyncStorage.default.getItem(key);
    return value ? safeJsonParse(value, fallback) : fallback;
  } catch (error) {
    console.warn('Safe AsyncStorage get error:', error);
    return fallback;
  }
}

export async function safeAsyncStorageSet(
  key: string,
  value: any
): Promise<boolean> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.setItem(key, safeJsonStringify(value));
    return true;
  } catch (error) {
    console.warn('Safe AsyncStorage set error:', error);
    return false;
  }
}

// Safe navigation
export function safeNavigate(
  navigation: any,
  routeName: string,
  params?: any
): boolean {
  try {
    if (!navigation || typeof navigation.navigate !== 'function') {
      console.warn('Invalid navigation object');
      return false;
    }
    navigation.navigate(routeName, params);
    return true;
  } catch (error) {
    console.warn('Safe navigation error:', error);
    return false;
  }
}

// Safe theme access
export function safeThemeAccess(theme: any, path: string, fallback: any = '#000000') {
  return safeGet(theme, path, fallback);
}

// Safe employer access
export function safeEmployerAccess(employers: any[], id: string | null) {
  if (!id || !Array.isArray(employers)) return null;
  return employers.find(emp => emp?.id === id) || null;
}

// Safe date formatting
export function safeDateFormat(date: any, options?: Intl.DateTimeFormatOptions): string {
  try {
    const d = (date instanceof Date && !isNaN(date.getTime()))
      ? date
      : new Date(date);
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      throw new Error("Invalid date");
    }
    return d.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('Safe date format error:', error);
    return 'Invalid Date';
  }
}

// Safe currency formatting
export function safeCurrencyFormat(amount: any, currency: string = 'USD'): string {
  try {
    const safeAmount = safeNumber(amount);
    // Ensure currency is a string and fallback to 'USD' if invalid
    const safeCurrency = typeof currency === 'string' && currency.length === 3 ? currency : 'USD';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch (error) {
    console.warn('Safe currency format error:', error);
    return '$0.00';
  }
}
