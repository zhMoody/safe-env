/***
 * 将 .env 内容字符串解析为对象
 * 兼容带引号的值、多层引号内部的注释标识符以及行尾注释
 */
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
      // 查找闭合引号
      const closingQuoteIndex = value.indexOf(firstChar, 1);
      if (closingQuoteIndex !== -1) {
        // 成功提取引号内的值
        env[key] = value.slice(1, closingQuoteIndex);
        continue;
      }
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
