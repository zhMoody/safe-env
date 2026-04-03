/*
 * @Author: moody
 * @Date: 2026-04-03 18:30:00
 * @FilePath: \safe-env\src\schema.ts
 */
import { FieldDefinition, BaseType } from "./types.js";

function createField<T, D extends string = string>(
  type: BaseType,
  defaultValue: T | undefined,
  parse: (v: any) => T,
  options: any[] = [],
): FieldDefinition<T, D> {
  const def: FieldDefinition<T, any> = {
    type,
    default: defaultValue,
    required: defaultValue === undefined,
    parse,
    metadata: options.length ? { options } : {},

    from(key: string) { this.sourceKey = key; return this; },
    validate(fn: (val: T) => boolean, message = "Custom validation failed") {
      this.metadata = { ...this.metadata, validate: { fn, message } };
      return this;
    },
    min(val: number) { this.metadata = { ...this.metadata, min: val }; return this; },
    max(val: number) { this.metadata = { ...this.metadata, max: val }; return this; },
    transform<U>(fn: (val: T) => U): FieldDefinition<U, any> {
      const op = this.parse;
      this.parse = (v: any) => fn(op(v)) as any;
      return this as unknown as FieldDefinition<U, any>;
    },
    secret() { this.metadata = { ...this.metadata, isSecret: true }; return this; },
    url() { return this.validate((v: T) => { try { new URL(String(v)); return true; } catch (e) { return false; } }, "Invalid URL format"); },
    email() { return this.validate((v: T) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(String(v)), "Invalid email format"); },
    regex(pattern: RegExp, message = "Value does not match pattern") { return this.validate((v: T) => pattern.test(String(v)), message); },
    description<NewD extends string>(text: NewD): FieldDefinition<T, NewD> {
      this.metadata = { ...this.metadata, description: text };
      return this as unknown as FieldDefinition<T, NewD>;
    },
  };
  return def as FieldDefinition<T, D>;
}

export const s = {
  string: (d?: string): FieldDefinition<string> => createField("string", d, (v: any) => String(v)),
  number: (d?: number): FieldDefinition<number> => createField("number", d, (v: any) => {
    const n = Number(v);
    if (isNaN(n)) throw new Error(`Invalid number: ${v}`);
    return n;
  }),
  boolean: (d?: boolean): FieldDefinition<boolean> => createField("boolean", d, (v: any) => {
    if (typeof v === "boolean") return v;
    if (v === undefined || v === "") return false;
    const s = String(v).toLowerCase().trim();
    if (["true", "1", "yes", "on"].includes(s)) return true;
    if (["false", "0", "no", "off"].includes(s)) return false;
    throw new Error(`Invalid boolean: ${v}`);
  }),
  enum: <T extends string>(o: T[], d?: T): FieldDefinition<T> => createField("enum", d, (v: any) => {
    if (!o.includes(v)) throw new Error(`Value "${v}" is not one of: ${o.join(", ")}`);
    return v as T;
  }, o),
  array: (d?: string[], sep = ","): FieldDefinition<string[]> => createField("array", d, (v: any) => {
    if (Array.isArray(v)) return v;
    if (typeof v !== "string") return [];
    return v.split(sep).map((i) => i.trim()).filter(Boolean);
  }),
};
