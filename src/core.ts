/*
 * @Author: moody
 * @Date: 2026-03-31 14:56:13
 * @LastEditTime: 2026-03-31 14:58:30
 * @FilePath: \safe-env\src\core.ts
 */
import { loadDotEnv } from "./dotenv.js";
import { InferSchema, Schema, EnvError } from "./types.js";
import { reportErrors } from "./reporter.js";

interface SafeEnvOptions {
  mode?: string;
  loadProcessEnv?: boolean;
  source?: Record<string, any>;
  prefix?: string;
}

export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions = {},
): InferSchema<T> {
  const { loadProcessEnv = true, source: manualSource, prefix = "" } = options;

  let source: Record<string, any>;

  if (manualSource) {
    source = manualSource;
  } else {
    const mode =
      options.mode ||
      (typeof process !== "undefined" ? process.env.NODE_ENV : "development");
    const filesToLoad = [
      ".env",
      ".env.local",
      `.env.${mode}`,
      `.env.${mode}.local`,
    ];

    let combinedData: Record<string, string> = {};
    for (const file of filesToLoad) {
      combinedData = { ...combinedData, ...loadDotEnv(file) };
    }

    source = {
      ...combinedData,
      ...(loadProcessEnv && typeof process !== "undefined" ? process.env : {}),
    };
  }

  const result = {} as any;
  const errors: EnvError[] = [];

  for (const key in schema) {
    const definition = schema[key];

    // 自动寻找 Key：优先用 definition.sourceKey，
    // 其次尝试 prefix + key (如 VITE_PORT)，
    // 最后用原 key (如 PORT)
    const lookupKey =
      definition.sourceKey ||
      (source[prefix + key] !== undefined ? prefix + key : key);

    const rawValue = source[lookupKey];

    try {
      let parsedValue: any;

      if (
        rawValue === undefined ||
        (rawValue === "" && definition.default !== undefined)
      ) {
        if (definition.required && rawValue === undefined) {
          throw new Error("Required field missing");
        }
        parsedValue = definition.default;
      } else {
        parsedValue = definition.parse(rawValue);
      }

      if (parsedValue !== undefined && definition.metadata) {
        const { min, max, validate } = definition.metadata;
        if (typeof parsedValue === "number") {
          if (min !== undefined && parsedValue < min)
            throw new Error(`Below min ${min}`);
          if (max !== undefined && parsedValue > max)
            throw new Error(`Above max ${max}`);
        }
        if (validate && !validate.fn(parsedValue))
          throw new Error(validate.message);
      }

      result[key] = parsedValue;
    } catch (err: any) {
      errors.push({ key: lookupKey, error: err.message, value: rawValue });
    }
  }

  if (errors.length > 0) {
    reportErrors(errors);
    const isRealNode = typeof process !== "undefined" && !!process.exit;
    if (isRealNode && !manualSource) {
      process.exit(1);
    } else {
      throw new Error("SafeEnv: Configuration validation failed.");
    }
  }

  return result;
}
