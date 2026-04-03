/*
 * @Author: moody
 * @Date: 2026-04-03 17:15:00
 * @FilePath: \safe-env\src\vite.ts
 */
import { loadEnv, type Plugin, type ResolvedConfig } from "vite";
import { safeEnv } from "./core.js";
import type { Schema } from "./types.js";
import { SERVE, VITE_DEV_FLAG, VITE_PREFIX } from "./types.js";

/**
 * Vite 插件：在构建或开发启动时校验环境变量
 */
export function viteSafeEnv(schema: Schema, options: any = {}): Plugin {
  let errorObject: any = null;
  let isDev = false;

  return {
    name: "vite-plugin-safe-env",
    configResolved(config: ResolvedConfig) {
      isDev = config.command === SERVE;
      process.env[VITE_DEV_FLAG] = isDev ? "true" : "";

      const { envDir = config.root, prefix = config.envPrefix || VITE_PREFIX } =
        options;
      // 准确加载对应模式的环境变量
      const env = loadEnv(config.mode, envDir, prefix);

      try {
        safeEnv(schema, {
          source: env,
          prefix: Array.isArray(prefix) ? prefix[0] : prefix,
          loadProcessEnv: false,
          throwOnError: true,
        } as any);
        errorObject = null;
      } catch (err: any) {
        errorObject = err;

        if (!isDev) {
          console.error(err.message);
          console.error(
            "\x1b[31m[safe-env] Fatal: Environment validation failed during build. Exiting...\x1b[0m\n",
          );
          process.exit(1);
        } else {
          // 开发模式：仅打印
          config.logger.error(err.message);
        }
      }
    },

    transform(code: string, id: string) {
      if (isDev && errorObject && code.includes("@zh-moody/safe-env")) {
        const overlayError = new Error(
          errorObject.plainMessage || errorObject.message,
        );
        overlayError.stack = "";
        throw overlayError;
      }
      return null;
    },
  };
}
