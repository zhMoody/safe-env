/*
 * @Author: moody
 * @Date: 2026-04-03 18:20:00
 * @FilePath: \safe-env\src\core.ts
 */
import { InferSchema, Schema, EnvError, SafeEnvOptions, DEV, VITE_DEV_FLAG } from "./types.js";
import { reportErrors, formatErrorReport } from "./reporter.js";

const globalEnvCache: Record<string, any> = {};

function createErrorProxy(): any {
  return new Proxy({}, { get: () => undefined });
}

export function safeEnv<T extends Schema>(
  schema: T,
  options: SafeEnvOptions & { throwOnError?: boolean; useCache?: boolean } = {},
): Readonly<InferSchema<T>> {
  const { loadProcessEnv = true, prefix = "", cwd, useCache = true } = options;

  const isBrowser = typeof window !== "undefined";
  const isVite = typeof process !== "undefined" && (!!process.env.VITE || !!process.env[VITE_DEV_FLAG]);
  const isProtectedEnv = isBrowser || isVite || ('source' in options);

  let source: Record<string, any>;

  if (useCache && Object.keys(globalEnvCache).length > 0 && !('source' in options)) {
    source = globalEnvCache;
  } else if ('source' in options) {
    source = options.source || {};
    if (useCache && Object.keys(source).length > 0) Object.assign(globalEnvCache, source);
  } else {
    if (typeof process !== "undefined" && !isBrowser) {
      try {
        const mode = options.mode || process.env.NODE_ENV || DEV;
        const { loadDotEnv } = require("./fs-node.cjs"); 
        let combinedData: Record<string, string> = {};
        for (const f of [".env", `.env.${mode}`, ".env.local", `.env.${mode}.local` ]) {
          combinedData = { ...combinedData, ...loadDotEnv(f, cwd) };
        }
        source = { ...combinedData, ...(loadProcessEnv ? process.env : {}) };
        if (useCache && Object.keys(source).length > 0) Object.assign(globalEnvCache, source);
      } catch (e) { source = {}; }
    } else { source = {}; }
  }

  if (isProtectedEnv && Object.keys(source).length === 0) return {} as any;

  const result = {} as any;
  const errors: EnvError[] = [];

  for (const key in schema) {
    const d = schema[key];
    const prefixedKey = (prefix && !key.startsWith(prefix)) ? (prefix + key) : key;
    const lookupKey = d.sourceKey || (source[prefixedKey] !== undefined ? prefixedKey : (source[key] !== undefined ? key : prefixedKey));
    const raw = source[lookupKey];

    try {
      if (raw === undefined || (raw === "" && d.default !== undefined)) {
        if (d.required && raw === undefined) throw new Error("Missing required field");
        result[key] = d.default;
      } else {
        const val = d.parse(raw);
        if (val !== undefined && d.metadata) {
          const { min, max, validate } = d.metadata;
          if (typeof val === "number") {
            if (min !== undefined && val < min) throw new Error(`Below min ${min}`);
            if (max !== undefined && val > max) throw new Error(`Above max ${max}`);
          }
          if (validate && !validate.fn(val)) throw new Error(validate.message);
        }
        result[key] = val;
      }
    } catch (err: any) {
      errors.push({ key: lookupKey, error: err.message, value: raw, isSecret: d.metadata?.isSecret });
    }
  }

  if (errors.length > 0) {
    if (options.throwOnError) {
      const err = new Error(formatErrorReport(errors, true));
      (err as any).plainMessage = formatErrorReport(errors, false);
      throw err;
    }
    reportErrors(errors);
    if (typeof process !== "undefined" && !!process.exit && !isProtectedEnv) process.exit(1);
    return createErrorProxy();
  }

  return Object.freeze(result);
}
