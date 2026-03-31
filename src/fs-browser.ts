/**
 * 浏览器端不需要读取文件，所以返回空对象
 */
export function loadDotEnv(_filePath = ".env"): Record<string, string> {
  return {};
}
