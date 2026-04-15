/*
 * @Author: moody
 * @Date: 2026-04-03 18:20:00
 * @FilePath: \safe-env\src\core.ts
 */
import {
  InferSchema,
  Schema,
  EnvError,
  SafeEnvOptions,
  DEV,
  VITE_DEV_FLAG,
  VITE_PREFIX,
  ValidationContext,
} from "./types.js";
import { reportErrors, formatErrorReport } from "./reporter.js";

// 二级缓存：key = `${prefix}|${cwd ?? ''}|${mode ?? ''}` 避免不同调用间互相污染
const globalEnvCache: Record<string, Record<string, any>> = {};
const proxyCache = new WeakMap<object, any>();

function createErrorProxy(errors: EnvError[]): any {
  // 一次性格式化，不在 get trap 中重复计算，errors 数组不被闭包持有
  const message = formatErrorReport(errors, false);
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "__isSafeEnvError") return true;
        if (prop === "toJSON")
          return () => ({ error: "SafeEnv Validation Failed" });
        throw new Error(
          `[safe-env] Cannot access "${String(prop)}" because validation failed:\n${message}`,
        );
      },
      ownKeys() {
        return [];
      },
      getOwnPropertyDescriptor() {
        return undefined;
      },
    },
  );
}

const ERR_READ_ONLY =
  "[safe-env] Cannot modify read-only environment variables.";

export function createReadOnlyProxy<T extends object>(target: T): T {
  if (proxyCache.has(target)) {
    return proxyCache.get(target);
  }

  const proxy = new Proxy(target, {
    get(obj, prop) {
      if (prop === "__isSafeEnv") return true;
      const val = Reflect.get(obj, prop);
      if (val !== null && typeof val === "object" && !Object.isFrozen(val)) {
        return createReadOnlyProxy(val);
      }
      return val;
    },
    set() {
      throw new Error(ERR_READ_ONLY);
    },
    deleteProperty() {
      throw new Error(ERR_READ_ONLY);
    },
    defineProperty() {
      throw new Error(ERR_READ_ONLY);
    },
    setPrototypeOf() {
      throw new Error(ERR_READ_ONLY);
    },
  });

  proxyCache.set(target, proxy);
  return proxy;
}

/**
 * 解析环境变量 key 的查找顺序：
 * 1. sourceKey（.from() 指定的别名）
 * 2. key 本身（已含 prefix 或不需要 prefix）
 * 3. prefix + key（自动补前缀）
 */
function resolveKey(
  key: string,
  sourceKey: string | undefined,
  source: Record<string, any>,
  prefix: string,
): string {
  if (sourceKey) return sourceKey;
  if (source[key] !== undefined) return key;
  return prefix && !key.startsWith(prefix) ? prefix + key : key;
}

export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions & {
    throwOnError?: boolean;
    useCache?: boolean;
    envLoader?: (f: string, cwd?: string) => Record<string, string>;
  } = {},
): Readonly<InferSchema<T>> {
  const {
    loadProcessEnv = true,
    prefix = VITE_PREFIX,
    cwd,
    useCache = true,
    refreshCache = false,
    envLoader,
  } = options;

  const mode =
    options.mode ||
    (typeof process !== "undefined" ? process.env.NODE_ENV : undefined) ||
    DEV;

  // 缓存分区 key，隔离不同 prefix/cwd/mode 的调用
  const cacheKey = `${prefix}|${cwd ?? ""}|${mode}`;

  if (refreshCache) {
    // 原子删除当前分区，不影响其他 prefix/cwd/mode 的缓存
    delete globalEnvCache[cacheKey];
  }

  const isBrowser = typeof window !== "undefined";
  const isVite =
    typeof process !== "undefined" &&
    (!!process.env.VITE || !!process.env[VITE_DEV_FLAG]);
  const isProtectedEnv = isBrowser || isVite || "source" in options;

  let source: Record<string, any> = {};
  let isPrematureLoad = false;

  if ("source" in options) {
    if (options.source === undefined) {
      isPrematureLoad = true;
      source = {};
    } else {
      source = options.source;
    }
  } else if (
    useCache &&
    !refreshCache &&
    globalEnvCache[cacheKey] &&
    Object.keys(globalEnvCache[cacheKey]).length > 0
  ) {
    source = globalEnvCache[cacheKey];
  } else if (typeof process !== "undefined" && !isBrowser) {
    try {
      let combinedData: Record<string, string> = {};

      if (envLoader) {
        for (const f of [
          ".env",
          `.env.${mode}`,
          ".env.local",
          `.env.${mode}.local`,
        ]) {
          combinedData = { ...combinedData, ...envLoader(f, cwd) };
        }
      }

      source = { ...combinedData, ...(loadProcessEnv ? process.env : {}) };
    } catch (e) {
      source = {};
    }
  }

  // 写入缓存（仅在有数据且未使用 source 选项时）
  if (useCache && Object.keys(source).length > 0) {
    if (!globalEnvCache[cacheKey]) globalEnvCache[cacheKey] = {};
    Object.assign(globalEnvCache[cacheKey], source);
  }

  const result = {} as any;
  const errors: EnvError[] = [];

  for (const key in schema) {
    const d = schema[key];
    const lookupKey = resolveKey(key, d.sourceKey, source, prefix);
    const raw = source[lookupKey];

    const ctx: ValidationContext = { source, parsed: result };

    try {
      const isReq =
        typeof d.required === "function" ? d.required(ctx) : d.required;
      if (raw === undefined || (raw === "" && d.default !== undefined)) {
        if (isReq && raw === undefined)
          throw new Error("Missing required field");
        result[key] = d.default;
      } else {
        result[key] = d.parse(raw, ctx);
      }
    } catch (err: any) {
      errors.push({
        key: lookupKey,
        error: err.message,
        value: raw,
        isSecret: d.metadata?.isSecret,
      });
    }
  }

  if (errors.length > 0) {
    if (options.throwOnError) {
      const err = new Error(formatErrorReport(errors, true));
      (err as any).plainMessage = formatErrorReport(errors, false);
      throw err;
    }
    if (!isPrematureLoad) {
      reportErrors(errors);
    }
    if (typeof process !== "undefined" && !!process.exit && !isProtectedEnv)
      process.exit(1);
    return createErrorProxy(errors);
  }

  return createReadOnlyProxy(result);
}
