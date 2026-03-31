/*
 * @Author: moody
 * @Date: 2026-03-31 14:47:38
 * @LastEditTime: 2026-03-31 14:58:41
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
    createField("boolean", defaultValue, (v) => v === "true" || v === true),

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
};
