/***
 * 将 .env 内容字符串解析为对象
 * 兼容带引号的值、转义字符（\"、\'）、以及行尾注释
 */

/**
 * 从引号起始位置提取引号内的值，支持转义字符。
 * 返回 null 表示未找到匹配的闭合引号（回退到无引号处理）。
 */
function extractQuoted(value: string, quote: string): string | null {
  let result = "";
  let i = 1; // 跳过开头的引号
  while (i < value.length) {
    if (value[i] === "\\" && i + 1 < value.length) {
      // 转义字符：跳过反斜杠，保留下一个字符
      result += value[i + 1];
      i += 2;
      continue;
    }
    if (value[i] === quote) {
      return result; // 找到闭合引号
    }
    result += value[i++];
  }
  return null; // 未找到闭合引号
}

export function parseDotEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const equalsIndex = trimmedLine.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmedLine.slice(0, equalsIndex).trim();
    let value = trimmedLine.slice(equalsIndex + 1).trim();

    if (!value) {
      env[key] = "";
      continue;
    }

    const firstChar = value[0];
    if (firstChar === '"' || firstChar === "'") {
      const extracted = extractQuoted(value, firstChar);
      if (extracted !== null) {
        env[key] = extracted;
        continue;
      }
      // 未找到闭合引号，回退到无引号处理
    }

    // 处理无引号或引号不匹配的情况，剔除行尾注释
    const commentIndex = value.indexOf("#");
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim();
    }
    env[key] = value;
  }
  return env;
}
