/*
 * @Author: moody
 * @Date: 2026-03-31 14:56:13
 * @LastEditTime: 2026-04-01 13:50:00
 * @FilePath: \safe-env\src\core.ts
 */
import { loadDotEnv } from "./fs-node.js";
import { InferSchema, Schema, EnvError } from "./types.js";
import { reportErrors } from "./reporter.js";

interface SafeEnvOptions {
  mode?: string;
  loadProcessEnv?: boolean;
  source?: Record<string, any>;
  prefix?: string;
  cwd?: string;
}

export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions = {},
): Readonly<InferSchema<T>> {
  const {
    loadProcessEnv = true,
    source: manualSource,
    prefix = "",
    cwd,
  } = options;

  // 如果手动传入了 source 但它是 undefined (例如在 Node 环境读取 import.meta.env)
  // 且不是在运行真正的校验流程（由 Vite 插件手动触发），则返回一个空代理或跳过
  // 这里采取最简单的策略：如果 manualSource 存在但未定义，我们将其视为空对象，防止崩溃
  let source: Record<string, any>;

  if (manualSource !== undefined) {
    source = manualSource || {};
  } else {
    const mode =
      options.mode ||
      (typeof process !== "undefined" ? process.env.NODE_ENV : "development");
    const filesToLoad = [
      ".env",
      `.env.${mode}`,
      ".env.local",
      `.env.${mode}.local`,
    ];

    let combinedData: Record<string, string> = {};
    for (const file of filesToLoad) {
      combinedData = { ...combinedData, ...loadDotEnv(file, cwd) };
    }

    source = {
      ...combinedData,
      ...(loadProcessEnv && typeof process !== "undefined" ? process.env : {}),
    };
  }

  const result = {} as any;
  const errors: EnvError[] = [];

  for (const key in schema) {
    const definition = schema[key];

    // 自动寻找 Key：优先用 definition.sourceKey，
    // 其次尝试 prefix + key (如 VITE_PORT)，
    // 如果 prefix + key 不存在且没有 prefix，或者 prefix + key 也不在 source 中，
    // 则尝试原 key (如 PORT)
    let lookupKey = definition.sourceKey;
    if (!lookupKey) {
      const prefixedKey = prefix + key;
      if (source[prefixedKey] !== undefined) {
        lookupKey = prefixedKey;
      } else if (source[key] !== undefined) {
        lookupKey = key;
      } else {
        // 如果都没找到，默认显示带前缀的 key (对于报错更友好)
        lookupKey = prefix ? prefixedKey : key;
      }
    }

    const rawValue = source[lookupKey];

    try {
      let parsedValue: any;

      if (
        rawValue === undefined ||
        (rawValue === "" && definition.default !== undefined)
      ) {
        if (definition.required && rawValue === undefined) {
          throw new Error("Required field missing");
        }
        parsedValue = definition.default;
      } else {
        parsedValue = definition.parse(rawValue);
      }

      if (parsedValue !== undefined && definition.metadata) {
        const { min, max, validate } = definition.metadata;
        if (typeof parsedValue === "number") {
          if (min !== undefined && parsedValue < min)
            throw new Error(`Below min ${min}`);
          if (max !== undefined && parsedValue > max)
            throw new Error(`Above max ${max}`);
        }
        if (validate && !validate.fn(parsedValue))
          throw new Error(validate.message);
      }

      result[key] = parsedValue;
    } catch (err: any) {
      errors.push({ key: lookupKey, error: err.message, value: rawValue });
    }
  }

  if (errors.length > 0) {
    reportErrors(errors);
    const isRealNode = typeof process !== "undefined" && !!process.exit;
    const isTest =
      typeof process !== "undefined" && process.env.NODE_ENV === "test";
    if (isRealNode && !manualSource && !isTest) {
      process.exit(1);
    } else {
      throw new Error("SafeEnv: Configuration validation failed.");
    }
  }

  return Object.freeze(result);
}
