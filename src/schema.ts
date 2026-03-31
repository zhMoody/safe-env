/*
 * @Author: moody
 * @Date: 2026-03-31 14:47:38
 * @LastEditTime: 2026-03-31 14:58:41
 * @FilePath: \safe-env\src\schema.ts
 */
import { FieldDefinition } from "./types.js";

export const s = {
  string: (defaultValue?: string): FieldDefinition<string> => ({
    type: "string",
    default: defaultValue,
    required: defaultValue === undefined,
    parse: (v: any) => String(v),
  }),
  number: (defaultValue?: number): FieldDefinition<number> => ({
    type: "number",
    default: defaultValue,
    required: defaultValue === undefined,
    parse: (v: any) => {
      const n = Number(v);
      if (isNaN(n)) throw new Error(`Invalid number: ${v}`);
      return n;
    },
  }),
  boolean: (defaultValue?: boolean): FieldDefinition<boolean> => ({
    type: "boolean",
    default: defaultValue,
    required: defaultValue === undefined,
    parse: (v: any) => v === "true" || v === true,
  }),
};
