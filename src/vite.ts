/*
 * @Author: moody
 * @Date: 2026-04-03 18:25:00
 * @FilePath: \safe-env\src\vite.ts
 */
import { loadEnv, type Plugin } from "vite";
import { safeEnv } from "./core.js";
import { SERVE, VITE_DEV_FLAG, VITE_PREFIX } from "./types.js";

export function viteSafeEnv(schema: any, options: any = {}): Plugin {
  let errorObject: any = null;
  let isDev = false;

  return {
    name: "vite-plugin-safe-env",
    configResolved(config) {
      isDev = config.command === SERVE;
      process.env[VITE_DEV_FLAG] = isDev ? 'true' : '';

      const { envDir = config.root, prefix = config.envPrefix || VITE_PREFIX } = options;
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
          console.error("\x1b[31m[safe-env] Production build aborted.\x1b[0m\n");
          process.exit(1);
        }
        config.logger.error(err.message);
      }
    },

    transform(code, id) {
      if (isDev && errorObject && code.includes('@zh-moody/safe-env')) {
        const overlayError = new Error(errorObject.plainMessage || errorObject.message);
        overlayError.stack = '';
        throw overlayError;
      }
      return null;
    },
  };
}
