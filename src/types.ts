/*
 * @Author: moody
 * @Date: 2026-03-31 14:50:13
 * @LastEditTime: 2026-03-31 14:58:46
 * @FilePath: \safe-env\src\types.ts
 */
export type BaseType = "string" | "number" | "boolean";

export interface FieldDefinition<T = any> {
  type: BaseType;
  default?: T;
  required: boolean;
  parse: (val: any) => T;
}

export type Schema = Record<string, FieldDefinition>;

export interface EnvError {
  key: string;
  error: string;
  value: any;
}

export type InferSchema<T> = {
  [K in keyof T]: T[K] extends FieldDefinition<infer U> ? U : never;
};
