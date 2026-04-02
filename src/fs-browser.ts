/**
 * 浏览器端不需要读取文件，所以返回空对象
 */
export function loadDotEnv(_filePath = ".env", _cwd?: string): Record<string, string> {
  return {};
}
