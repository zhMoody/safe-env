/*
 * @Author: moody
 * @Date: 2026-04-03 18:30:00
 * @FilePath: \safe-env\src\schema.ts
 */
import type { FieldDefinition, FieldMetadata, BaseType, ValidationContext } from "./types.js";

class FieldDef<T, D extends string = string> implements FieldDefinition<T, D> {
  type: BaseType;
  default?: T;
  required: boolean | ((ctx: ValidationContext) => boolean);
  sourceKey?: string;
  metadata: FieldMetadata;
  parse: (val: any, ctx: ValidationContext) => T;

  constructor(
    type: BaseType,
    defaultValue: T | undefined,
    parse: (v: any, ctx: ValidationContext) => T,
    options: string[] = []
  ) {
    this.type = type;
    this.default = defaultValue;
    this.required = defaultValue === undefined;
    this.parse = parse;
    this.metadata = options.length ? { options } : {};
  }

  from(key: string) {
    this.sourceKey = key;
    return this as unknown as FieldDefinition<T, D>;
  }

  optional() {
    this.required = false;
    return this as unknown as FieldDefinition<T | undefined, D>;
  }

  requiredIf(fn: (ctx: ValidationContext) => boolean) {
    this.required = fn;
    return this as unknown as FieldDefinition<T, D>;
  }

  validate(fn: (val: T, ctx: ValidationContext) => boolean, message = "Custom validation failed") {
    const op = this.parse;
    this.parse = (v: any, ctx: ValidationContext) => {
      const val = op(v, ctx);
      if (!fn(val, ctx)) throw new Error(message);
      return val;
    };
    return this as unknown as FieldDefinition<T, D>;
  }

  min(val: number) {
    const op = this.parse;
    this.parse = (v: any, ctx: ValidationContext) => {
      const n = op(v, ctx);
      if (typeof n === "number" && n < val) throw new Error(`Below min ${val}`);
      return n;
    };
    this.metadata = { ...this.metadata, min: val };
    return this as unknown as FieldDefinition<T, D>;
  }

  max(val: number) {
    const op = this.parse;
    this.parse = (v: any, ctx: ValidationContext) => {
      const n = op(v, ctx);
      if (typeof n === "number" && n > val) throw new Error(`Above max ${val}`);
      return n;
    };
    this.metadata = { ...this.metadata, max: val };
    return this as unknown as FieldDefinition<T, D>;
  }

  transform<U>(fn: (val: T, ctx: ValidationContext) => U) {
    const op = this.parse;
    this.parse = (v: any, ctx: ValidationContext) => fn(op(v, ctx), ctx) as any;
    return this as unknown as FieldDefinition<U, D>;
  }

  secret() {
    this.metadata = { ...this.metadata, isSecret: true };
    return this as unknown as FieldDefinition<T, D>;
  }



  description<NewD extends string>(text: NewD) {
    this.metadata = { ...this.metadata, description: text };
    return this as unknown as FieldDefinition<T, NewD>;
  }
}

export const s = {
  string: (d?: string): FieldDefinition<string> => new FieldDef("string", d, (v: any) => String(v)),
  number: (d?: number): FieldDefinition<number> => new FieldDef("number", d, (v: any) => {
    const n = Number(v);
    if (isNaN(n)) throw new Error(`Invalid number value: "${v}"`);
    return n;
  }),
  boolean: (d?: boolean): FieldDefinition<boolean> => new FieldDef("boolean", d, (v: any) => {
    if (typeof v === "boolean") return v;
    // 显式设为空字符串 → false（与未设置区分：未设置走 core.ts 的 default 路径，不会进入此 parse）
    if (v === "") return false;
    const s = String(v).toLowerCase().trim();
    if (["true", "1", "yes", "on"].includes(s)) return true;
    if (["false", "0", "no", "off"].includes(s)) return false;
    throw new Error(`Invalid boolean value: "${v}"`);
  }),
  enum: <T extends string>(o: T[], d?: T): FieldDefinition<T> => new FieldDef("enum", d, (v: any) => {
    if (!o.includes(v)) throw new Error(`Value "${v}" is not one of: ${o.join(", ")}`);
    return v as T;
  }, o as string[]),
  array: (d?: string[], sep = ","): FieldDefinition<string[]> => new FieldDef("array", d, (v: any) => {
    if (!sep) throw new Error("[safe-env] array separator cannot be empty");
    if (Array.isArray(v)) return v;
    if (typeof v !== "string") return [];
    return v.split(sep).map((i) => i.trim()).filter(Boolean);
  }),
};
