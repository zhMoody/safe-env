/*
 * @Author: moody
 * @Date: 2026-03-31 14:26:33
 * @LastEditTime: 2026-04-05 10:00:00
 * @FilePath: \safe-env\src\index.ts
 */

// 核心功能：这些是运行时必须的
export { safeEnv } from "./core.js";
export { s } from "./schema.js";

// 类型定义：编译时使用，不占体积
export * from "./types.js";

// 辅助工具：如果用户没用到，Tree-shaking 会将其剔除
export { parseDotEnv } from "./dotenv.js";
export { reportErrors, formatErrorReport } from "./reporter.js";
