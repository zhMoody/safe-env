/*
 * @Author: moody
 * @Date: 2026-04-03 18:35:00
 * @FilePath: \safe-env\src\reporter.ts
 */
import { EnvError } from "./types.js";

const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";

export function formatErrorReport(errors: EnvError[], useColor = true): string {
  if (isBrowser) {
    return `SafeEnv Validation Failed: ${errors.map((e) => `${e.key} (${e.error})`).join(", ")}`;
  }

  const c = {
    r: "\x1b[31m",
    g: "\x1b[32m",
    y: "\x1b[33m",
    b: "\x1b[1m",
    res: "\x1b[0m",
    d: "\x1b[2m",
    cy: "\x1b[36m",
  };
  const p = (s: any, n: number) => {
    let r = String(s);
    const w = () => {
      let len = 0;
      for (const ch of r) {
        const cp = ch.codePointAt(0) ?? 0;
        // CJK、emoji 等宽字符（占 2 列）
        len += (cp > 0xff || (cp >= 0x1F000 && cp <= 0x1FFFF)) ? 2 : 1;
      }
      return len;
    };
    while (w() > n) r = r.slice(0, -1);
    return r + " ".repeat(n - w());
  };

  const total =
    Math.max(
      80,
      (typeof process !== "undefined" ? process.stdout.columns : 80) || 80,
    ) - 10;
  const K = Math.floor(total * 0.3),
    E = Math.floor(total * 0.5);
  const colors = useColor
    ? c
    : { r: "", g: "", y: "", b: "", res: "", d: "", cy: "" };

  let output = `\n${colors.r}${colors.b}❌ SafeEnv Validation Failed${colors.res}\n`;
  output += ` ${colors.b}${p("Key", K)} │ ${p("Error", E)} │ Value${colors.res}\n`;
  output += colors.d + "─".repeat(total + 5) + colors.res + "\n";
  errors.forEach((e) => {
    const val =
      e.value === undefined
        ? "undefined"
        : e.isSecret
          ? "********"
          : `"${e.value}"`;
    const vc =
      e.value === undefined ? colors.d : e.isSecret ? colors.y : colors.cy;
    output += ` ${colors.y}${p(e.key, K)}${colors.res} │ ${colors.r}${p(e.error, E)}${colors.res} │ ${vc}${val}${colors.res}\n`;
  });
  output += colors.d + "─".repeat(total + 5) + colors.res + "\n";
  output += ` ${colors.g}💡 Tip: Check your .env files or schema definitions.${colors.res}\n`;
  return output;
}

export function reportErrors(errors: EnvError[]) {
  if (isBrowser) {
    console.group(
      "%c ❌ SafeEnv Validation Failed ",
      "background: #fee2e2; color: #b91c1c; font-weight: bold; padding: 4px; border-radius: 2px;",
    );
    const tableData = errors.reduce((acc, e) => {
      acc[e.key] = {
        "Error Message": e.error,
        "Current Value":
          e.value === undefined
            ? "undefined"
            : e.isSecret
              ? "********"
              : e.value,
      };
      return acc;
    }, {} as any);
    console.table(tableData);
    console.log(
      "%c 💡 Tip: Check your .env files or schema definitions. ",
      "color: #059669; font-style: italic;",
    );
    console.groupEnd();
  } else {
    console.error(formatErrorReport(errors, true));
  }
}
