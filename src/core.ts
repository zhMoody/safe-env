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
}

export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions = {},
): InferSchema<T> {
  // 1. 确定当前模式 (优先使用传入的 mode，其次用系统 NODE_ENV，默认 development)
  const mode = options.mode || process.env.NODE_ENV || "development";
  const { loadProcessEnv = true } = options;

  // 2. 定义加载顺序（越往后优先级越高，会覆盖前面的）
  const filesToLoad = [
    ".env",
    ".env.local",
    `.env.${mode}`,
    `.env.${mode}.local`,
  ];

  // 3. 逐个加载并合并
  let combinedData: Record<string, string> = {};
  for (const file of filesToLoad) {
    const data = loadDotEnv(file);
    combinedData = { ...combinedData, ...data };
  }

  // 4. 最后合并系统环境变量 (系统变量通常拥有最高优先级)
  const source = {
    ...combinedData,
    ...(loadProcessEnv ? process.env : {}),
  };

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
    process.exit(1);
  }

  return result;
}

