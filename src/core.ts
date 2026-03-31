/*
 * @Author: moody
 * @Date: 2026-03-31 14:56:13
 * @LastEditTime: 2026-03-31 14:58:30
 * @FilePath: \safe-env\src\core.ts
 */
import { loadDotEnv } from "./dotenv.js";
import { InferSchema, Schema, EnvError } from "./types.js";
import { reportErrors } from "./reporter.js";

interface SafeEnvOptions {
  mode?: string; // 显式指定模式，如 'development'
  loadProcessEnv?: boolean;
  source?: Record<string, any>; // 新增：支持手动传入数据源（如 Vite 的 import.meta.env）
}

export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions = {},
): InferSchema<T> {
  const { loadProcessEnv = true, source: manualSource } = options;

  let source: Record<string, any>;

  if (manualSource) {
    // 1. 如果手动提供了 source，直接使用它
    source = manualSource;
  } else {
    // 2. 否则，执行 Node 环境的自动加载逻辑
    const mode =
      options.mode ||
      (typeof process !== "undefined"
        ? process.env.NODE_ENV
        : "development");
    const filesToLoad = [
      ".env",
      ".env.local",
      `.env.${mode}`,
      `.env.${mode}.local`,
    ];

    let combinedData: Record<string, string> = {};
    for (const file of filesToLoad) {
      combinedData = { ...combinedData, ...loadDotEnv(file) };
    }

    source = {
      ...combinedData,
      ...(loadProcessEnv && typeof process !== "undefined"
        ? process.env
        : {}),
    };
  }

  const result = {} as any;
  const errors: EnvError[] = [];

  for (const key in schema) {
    const definition = schema[key];
    const rawValue = source[key];

    try {
      if (rawValue === undefined) {
        if (definition.required) {
          throw new Error("Required field missing");
        }

        result[key] = definition.default;
      } else {
        result[key] = definition.parse(rawValue);
      }
    } catch (err: any) {
      errors.push({
        key,
        error: err.message,
        value: rawValue,
      });
    }
  }

  if (errors.length > 0) {
    reportErrors(errors);
    // 只有在 Node 环境下才直接退出
    if (typeof process !== "undefined" && process.exit) {
      process.exit(1);
    } else {
      throw new Error(
        "SafeEnv: Configuration validation failed. Check console for details.",
      );
    }
  }

  return result;
}

