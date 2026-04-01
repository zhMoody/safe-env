import { loadEnv, type Plugin } from 'vite';
import { safeEnv } from './core.js';
import type { Schema } from './types.js';

interface ViteSafeEnvOptions {
  /**
   * 环境变量目录，默认为项目根目录
   */
  envDir?: string;
  /**
   * 环境变量前缀，默认是 VITE_
   */
  prefix?: string | string[];
}

/**
 * Vite 插件：在构建或开发启动时校验环境变量
 */
export function viteSafeEnv(schema: Schema, options: ViteSafeEnvOptions = {}): Plugin {
  return {
    name: 'vite-plugin-safe-env',
    configResolved(config) {
      const { envDir = config.root, prefix = config.envPrefix || 'VITE_' } = options;
      
      // 1. 使用 Vite 内置的 loadEnv 加载当前模式下的所有环境变量
      const mode = config.mode;
      const env = loadEnv(mode, envDir, prefix);

      // 2. 执行校验
      try {
        // 我们传入 manualSource (env)，这样 safeEnv 就不会再去扫磁盘了
        // 因为 Vite 已经帮我们处理好了各种 .env.local 优先级
        safeEnv(schema, {
          source: env,
          prefix: Array.isArray(prefix) ? prefix[0] : prefix, // 传递 prefix
          loadProcessEnv: false // 在 Vite 插件中，我们只关心 Vite 注入的变量
        });
        
        // 如果没有抛错，说明校验通过
      } catch (err) {
        // 如果校验失败，safeEnv 内部的 reporter 已经打印了精美的表格
        // 我们只需要确保进程异常退出即可
        process.exit(1);
      }
    }
  };
}
