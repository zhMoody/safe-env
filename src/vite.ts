/*
 * @Author: moody
 * @Date: 2026-04-03 16:15:00
 * @FilePath: \safe-env\src\vite.ts
 */
import { loadEnv, type Plugin } from "vite";
import { safeEnv } from "./core.js";
import type { Schema } from "./types.js";

export function viteSafeEnv(schema: Schema, options: any = {}): Plugin {
  let errorObject: any = null;
  let isDev = false;

  return {
    name: "vite-plugin-safe-env",
    configResolved(config) {
      isDev = config.command === "serve";
      process.env.VITE_DEV_SERVER = isDev ? "true" : "";

      const { envDir = config.root, prefix = config.envPrefix || "VITE_" } =
        options;
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

        // 针对构建模式的硬拦截
        if (config.command === "build") {
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

    transform(code, id) {
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
