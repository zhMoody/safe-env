/*
 * @Author: moody
 * @Date: 2026-03-31 14:50:13
 * @LastEditTime: 2026-04-01 13:15:00
 * @FilePath: \safe-env\src\types.ts
 */
export type BaseType = "string" | "number" | "boolean" | "enum" | "array";

export interface FieldDefinition<T = any, D extends string = string> {
  type: BaseType;
  default?: T;
  required: boolean;
  sourceKey?: string;
  metadata?: {
    min?: number;
    max?: number;
    options?: T[];
    description?: string;
    validate?: {
      fn: (val: T) => boolean;
      message: string;
    };
  };
  parse: (val: any) => T;

  // 链式调用方法
  from: (key: string) => FieldDefinition<T, D>;
  validate: (fn: (val: T) => boolean, message?: string) => FieldDefinition<T, D>;
  min: (val: number) => FieldDefinition<T, D>;
  max: (val: number) => FieldDefinition<T, D>;
  transform: <U>(fn: (val: T) => U) => FieldDefinition<U, D>;
  
  // 新增规则
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
}

export type InferSchema<T> = {
  [K in keyof T]: T[K] extends FieldDefinition<infer U, infer D> 
    ? string extends D 
      ? U 
      : U & { /** @description 这个变量的用途 */ readonly __description?: D } 
    : never;
};
