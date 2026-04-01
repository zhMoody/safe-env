/***
 *  将 .env 内容字符串解析为对象
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
