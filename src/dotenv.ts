/***
 *  将 .env 内容字符串解析为对象
 *  这个函数是纯 JS，在浏览器和 Node 都能跑
 * */
export function parseDotEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;
    const index = trimmedLine.indexOf("=");
    if (index == -1) continue;

    const key = trimmedLine.slice(0, index).trim();
    let value = trimmedLine.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * 只有在 Node 环境下才调用的加载器
 * 这里使用同步的文件读取，但为了兼容浏览器打包，采用动态判断
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadDotEnv(filePath = ".env"): Record<string, string> {
  // 检查是否在 Node 环境
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  if (!isNode) return {};

  try {
    const fullPath = resolve(process.cwd(), filePath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      return parseDotEnv(content);
    }
  } catch (err) {
    // 忽略加载错误
  }
  return {};
}
