/*
 * @Author: moody
 * @Date: 2026-03-31 14:26:33
 * @LastEditTime: 2026-04-05 10:00:00
 * @FilePath: \safe-env\src\index.ts
 */

import { safeEnv as coreSafeEnv } from "./core.js";
import { loadDotEnv } from "./fs-node.js";
import { Schema, InferSchema, SafeEnvOptions } from "./types.js";

// 这些是运行时必须的
export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions & { throwOnError?: boolean; useCache?: boolean } = {},
): Readonly<InferSchema<T>> {
  const isNode = typeof process !== "undefined" && (process.release?.name === "node" || !!process.versions?.node);
  return coreSafeEnv(schema, { 
    ...options, 
    envLoader: isNode ? loadDotEnv : undefined 
  });
}

export { s } from "./schema.js";
export * from "./rules.js";

// 类型定义：编译时使用，不占体积
export * from "./types.js";

// 如果用户没用到，Tree-shaking 会将其剔除
export { parseDotEnv } from "./dotenv.js";
export { reportErrors, formatErrorReport } from "./reporter.js";
