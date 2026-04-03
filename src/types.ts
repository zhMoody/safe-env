/*
 * @Author: moody
 * @Date: 2026-04-03 14:50:00
 * @FilePath: \safe-env\src\types.ts
 */
export type BaseType = "string" | "number" | "boolean" | "enum" | "array";

export interface FieldDefinition<T = any, D extends string = string> {
  type: BaseType;
  default?: T;
  required: boolean;
  sourceKey?: string;
  parse: (val: any) => T;
  metadata?: any;
  from: (key: string) => FieldDefinition<T, D>;
  validate: (fn: (val: T) => boolean, message?: string) => FieldDefinition<T, D>;
  min: (val: number) => FieldDefinition<T, D>;
  max: (val: number) => FieldDefinition<T, D>;
  transform: <U>(fn: (val: T) => U) => FieldDefinition<U, D>;
  secret: () => FieldDefinition<T, D>;
  url: () => FieldDefinition<T, D>;
  email: () => FieldDefinition<T, D>;
  regex: (pattern: RegExp, message?: string) => FieldDefinition<T, D>;
  description: <NewD extends string>(text: NewD) => FieldDefinition<T, NewD>;
}

export type Schema = Record<string, FieldDefinition<any, any>>;

export interface EnvError {
  key: string;
  error: string;
  value: any;
  isSecret?: boolean;
}

export type InferSchema<T> = {
  [K in keyof T]: T[K] extends FieldDefinition<infer U, any> ? U : never;
};

export interface SafeEnvOptions {
  mode?: string;
  loadProcessEnv?: boolean;
  source?: Record<string, any>;
  prefix?: string;
  cwd?: string;
  manualSource?: boolean;
  devMode?: boolean;
}
