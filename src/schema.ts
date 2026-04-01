/*
 * @Author: moody
 * @Date: 2026-03-31 14:47:38
 * @LastEditTime: 2026-04-01 13:00:00
 * @FilePath: \safe-env\src\schema.ts
 */
import { FieldDefinition, BaseType } from "./types.js";

function createField<T>(
  type: BaseType,
  defaultValue: T | undefined,
  parse: (v: any) => T,
  options: any[] = [],
): FieldDefinition<T> {
  const definition: FieldDefinition<T> = {
    type,
    default: defaultValue,
    required: defaultValue === undefined,
    parse,
    metadata: options.length ? { options } : {},

    // 链式实现
    from(key: string) {
      this.sourceKey = key;
      return this;
    },
    validate(fn: (val: T) => boolean, message = "Custom validation failed") {
      this.metadata = { ...this.metadata, validate: { fn, message } };
      return this;
    },
    min(val: number) {
      this.metadata = { ...this.metadata, min: val };
      return this;
    },
    max(val: number) {
      this.metadata = { ...this.metadata, max: val };
      return this;
    },
    transform<U>(fn: (val: T) => U): FieldDefinition<U> {
      const originalParse = this.parse;
      this.parse = (v: any) => fn(originalParse(v)) as any;
      return this as unknown as FieldDefinition<U>;
    },
  };

  return definition;
}

export const s = {
  string: (defaultValue?: string): FieldDefinition<string> =>
    createField("string", defaultValue, (v) => String(v)),

  number: (defaultValue?: number): FieldDefinition<number> =>
    createField("number", defaultValue, (v) => {
      const n = Number(v);
      if (isNaN(n)) throw new Error(`Invalid number: ${v}`);
      return n;
    }),

  boolean: (defaultValue?: boolean): FieldDefinition<boolean> =>
    createField("boolean", defaultValue, (v) => {
      if (typeof v === "boolean") return v;
      const str = String(v).toLowerCase();
      return str === "true" || str === "1" || str === "yes" || str === "on";
    }),

  enum: <T extends string>(
    options: T[],
    defaultValue?: T,
  ): FieldDefinition<T> =>
    createField(
      "enum",
      defaultValue,
      (v) => {
        if (!options.includes(v)) {
          throw new Error(`Value "${v}" is not one of: ${options.join(", ")}`);
        }
        return v as T;
      },
      options,
    ),

  array: (
    defaultValue?: string[],
    separator = ",",
  ): FieldDefinition<string[]> =>
    createField("array", defaultValue, (v) => {
      if (Array.isArray(v)) return v;
      if (typeof v !== "string") return [];
      return v
        .split(separator)
        .map((item) => item.trim())
        .filter(Boolean);
    }),
};
