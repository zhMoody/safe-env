/*
 * @Author: moody
 * @Date: 2026-04-03 17:35:00
 * @FilePath: \safe-env\src\core.ts
 */
import { InferSchema, Schema, EnvError, SafeEnvOptions } from "./types.js";
import { reportErrors, formatErrorReport } from "./reporter.js";

const globalEnvCache: Record<string, any> = {};

function createErrorProxy(errors: EnvError[]): any {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (typeof prop === "symbol") return undefined;
        return undefined;
      },
    },
  );
}

/**
 * 核心校验函数
 */
export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions & { throwOnError?: boolean; useCache?: boolean } = {},
): Readonly<InferSchema<T>> {
  const { loadProcessEnv = true, prefix = "", cwd, useCache = true } = options;

  const isBrowser = typeof window !== "undefined";
  const isVite =
    typeof process !== "undefined" &&
    (!!process.env.VITE || !!process.env.VITE_DEV_SERVER);
  const isProtectedEnv = isBrowser || isVite || "source" in options;

  let source: Record<string, any>;

  // 1. 优先级：手动传入 > 缓存 > 磁盘解析
  if (
    useCache &&
    Object.keys(globalEnvCache).length > 0 &&
    !("source" in options)
  ) {
    source = globalEnvCache;
  } else if ("source" in options) {
    source = options.source || {};
    if (useCache && Object.keys(source).length > 0)
      Object.assign(globalEnvCache, source);
  } else {
    if (typeof process !== "undefined" && !isBrowser) {
      try {
        const mode = options.mode || process.env.NODE_ENV || "development";
        // 支持 mode 对应的文件名
        const filesToLoad = [
          ".env",
          `.env.${mode}`,
          ".env.local",
          `.env.${mode}.local`,
        ];

        // 动态加载 Node 特有逻辑
        const { loadDotEnv } = require("./fs-node.cjs");
        let combinedData: Record<string, string> = {};
        for (const file of filesToLoad) {
          combinedData = { ...combinedData, ...loadDotEnv(file, cwd) };
        }

        source = { ...combinedData, ...(loadProcessEnv ? process.env : {}) };
        if (useCache && Object.keys(source).length > 0)
          Object.assign(globalEnvCache, source);
      } catch (e) {
        source = {};
      }
    } else {
      source = {};
    }
  }

  // 开发环境下空数据保护
  if (isProtectedEnv && Object.keys(source).length === 0) {
    return {} as any;
  }

  const result = {} as any;
  const errors: EnvError[] = [];

  for (const key in schema) {
    const definition = schema[key];
    let lookupKey = definition.sourceKey;
    if (!lookupKey) {
      const prefixedKey =
        prefix && !key.startsWith(prefix) ? prefix + key : key;
      if (source[prefixedKey] !== undefined) lookupKey = prefixedKey;
      else if (source[key] !== undefined) lookupKey = key;
      else lookupKey = prefixedKey;
    }

    const rawValue = source[lookupKey];

    try {
      if (
        rawValue === undefined ||
        (rawValue === "" && definition.default !== undefined)
      ) {
        if (definition.required && rawValue === undefined)
          throw new Error("Missing required field");
        result[key] = definition.default;
      } else {
        const val = definition.parse(rawValue);
        if (val !== undefined && definition.metadata) {
          const { min, max, validate } = definition.metadata;
          if (typeof val === "number") {
            if (min !== undefined && val < min)
              throw new Error(`Below min ${min}`);
            if (max !== undefined && val > max)
              throw new Error(`Above max ${max}`);
          }
          if (validate && !validate.fn(val)) throw new Error(validate.message);
        }
        result[key] = val;
      }
    } catch (err: any) {
      errors.push({
        key: lookupKey,
        error: err.message,
        value: rawValue,
        isSecret: definition.metadata?.isSecret,
      });
    }
  }

  if (errors.length > 0) {
    const report = formatErrorReport(errors, !isBrowser);
    if (options.throwOnError) throw new Error(report);
    reportErrors(errors);
    if (typeof process !== "undefined" && !!process.exit && !isProtectedEnv)
      process.exit(1);
    return createErrorProxy(errors);
  }

  return Object.freeze(result);
}
