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

const globalEnvCache: Record<string, any> = {};
const proxyCache = new WeakMap<object, any>();

function createErrorProxy(errors: EnvError[]): any {
  const message = formatErrorReport(errors, false);
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "__isSafeEnvError") return true;
        if (prop === "toJSON") return () => ({ error: "SafeEnv Validation Failed" });
        throw new Error(`[safe-env] Cannot access "${String(prop)}" because validation failed:\n${message}`);
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

const ERR_READ_ONLY = "[safe-env] Cannot modify read-only environment variables.";

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

export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions & { throwOnError?: boolean; useCache?: boolean; envLoader?: (f: string, cwd?: string) => Record<string, string> } = {},
): Readonly<InferSchema<T>> {
  const {
    loadProcessEnv = true,
    prefix = VITE_PREFIX,
    cwd,
    useCache = true,
    refreshCache = false,
    envLoader,
  } = options;

  if (refreshCache) {
    for (const key in globalEnvCache) delete globalEnvCache[key];
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
  } else if (useCache && !refreshCache && Object.keys(globalEnvCache).length > 0) {
    source = globalEnvCache;
  } else if (typeof process !== "undefined" && !isBrowser) {
    try {
      const mode = options.mode || process.env.NODE_ENV || DEV;
      let combinedData: Record<string, string> = {};
      
      // 使用注入的加载器或默认不加载
      if (envLoader) {
        for (const f of [".env", `.env.${mode}`, ".env.local", `.env.${mode}.local`]) {
          combinedData = { ...combinedData, ...envLoader(f, cwd) };
        }
      }
      
      source = { ...combinedData, ...(loadProcessEnv ? process.env : {}) };
    } catch (e) {
      source = {};
    }
  }

  if (useCache && !refreshCache && Object.keys(globalEnvCache).length > 0) {
    if (Object.keys(source).length === 0) {
      source = globalEnvCache;
    } else {
      Object.assign(globalEnvCache, source);
    }
  } else if (useCache && Object.keys(source).length > 0) {
    Object.assign(globalEnvCache, source);
  }

  const result = {} as any;
  const errors: EnvError[] = [];

  for (const key in schema) {
    const d = schema[key];
    const prefixedKey = prefix && !key.startsWith(prefix) ? prefix + key : key;
    
    const lookupKey =
      d.sourceKey ||
      (source[prefixedKey] !== undefined
        ? prefixedKey
        : source[key] !== undefined
          ? key
          : prefixedKey);
    
    const raw = source[lookupKey];

    const ctx: ValidationContext = { source, parsed: result };

    try {
      const isReq = typeof d.required === "function" ? d.required(ctx) : d.required;
      if (raw === undefined || (raw === "" && d.default !== undefined)) {
        if (isReq && raw === undefined)
          throw new Error("Missing required field");
        result[key] = d.default;
      } else {
        const val = d.parse(raw, ctx);
        if (val !== undefined && d.metadata) {
          const { min, max } = d.metadata;
          if (typeof val === "number") {
            if (min !== undefined && val < min)
              throw new Error(`Below min ${min}`);
            if (max !== undefined && val > max)
              throw new Error(`Above max ${max}`);
          }
        }
        result[key] = val;
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
    // 静默屏蔽 Vite 配置文件早产环境的幽灵打印
    if (!isPrematureLoad) {
      reportErrors(errors);
    }
    if (typeof process !== "undefined" && !!process.exit && !isProtectedEnv)
      process.exit(1);
    return createErrorProxy(errors);
  }

  return createReadOnlyProxy(result);
}
