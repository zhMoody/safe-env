# @zh-moody/safe-env 🛡️

[![npm version](https://img.shields.io/npm/v/@zh-moody/safe-env.svg?style=flat-square)](https://www.npmjs.com/package/@zh-moody/safe-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/zhMoody/safe-env?style=flat-square)](https://github.com/zhMoody/safe-env)

[简体中文](./README.md) | English

**Say goodbye to `undefined`! Intercept all configuration risks at the first line of your app.**

Whether you are writing Vue, React, or Node.js, environment variables are often a source of production incidents. `safe-env` ensures your app always runs on the expected configuration through strong-typed Schema validation and runtime protection.

---

### 🚀 Core Features

- **Build-time Validation**: Provides a Vite plugin to intercept invalid configurations during development or build.
- **Sensitive Data Masking**: Supports `.secret()` to ensure keys and passwords are masked as `********` in logs or error tables.
- **Runtime Immutability**: Parsed config objects are deep-frozen with `Object.freeze` by default, preventing any illegal runtime modification.
- **Monorepo Ready**: Supports `cwd` parameter to explicitly specify the `.env` directory, ideal for complex project architectures.
- **IDE Enhancement**: Supports `.description()` to view variable usage and documentation directly via hover in your code.
- **Rigorous Type Parsing**: Built-in `s.array()`, `s.boolean()` with enhanced conversion, and `.transform()` for chainable piping.
- **Ultra-lightweight**: Only **1.9 KB** after Gzip, with zero runtime dependencies.

---

### 📦 Installation

```bash
npm install @zh-moody/safe-env
```

---

### 🚀 Quick Start

#### 🔹 [Vite / React / Vue]
For frontend projects, use the Vite plugin for **build-time validation**.

**1. Configure Vite Plugin (`vite.config.ts`):**
```typescript
import { viteSafeEnv } from '@zh-moody/safe-env/vite';
import { schema } from './src/env';

export default {
  plugins: [
    viteSafeEnv(schema)
  ]
}
```

**2. Define and Export Config (`src/env.ts`):**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

export const schema = {
  VITE_API_URL: s.string().url().description("Backend API Base URL"),
  VITE_PORT: s.number(3000).description("Development Server Port"),
};

export const env = safeEnv(schema, { 
  source: import.meta.env 
});
```

> **💡 Best Practice: Prevent Vite Type Pollution**
> To completely disable the insecure original `import.meta.env.XXX` hints, modify `src/vite-env.d.ts`:
> ```typescript
> interface ImportMetaEnv {
>   [key: string]: never;
> }
> ```

---

#### 🔸 [Node.js / Server-side]
In Node.js, the library automatically looks for and parses `.env` files on disk.

**1. Define Config (`src/config.ts`):**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

const config = safeEnv({
  DB_PASSWORD: s.string().secret().description("Database Password"),
  DB_PORT: s.number(5432).min(1).max(65535),
}, {
  // Explicitly specify the .env directory for Monorepo or specific deployments
  // cwd: '/path/to/project-root'
});

export default config;
```

---

### 🛠️ API Reference

#### 1. Define Fields (`s.xxx`)
- `s.string(default?)`: String field. Required if no default value.
- `s.number(default?)`: Automatically converted to `number` and validated.
- `s.boolean(default?)`: Supports `"true"`, `"1"`, `"yes"`, `"on"` as `true`.
- `s.array(default?, separator?)`: Splits string by separator (default `,`) into an array.
- `s.enum(options, default?)`: Value must be one of the provided options.

#### 2. Validation & Enhancement (Chainable)

- **`.secret()`**: Masks the value as `********` in error reports.
  ```typescript
  PASSWORD: s.string().secret()
  ```
- **`.url()` / `.email()`**: Built-in format validation.
  ```typescript
  API_URL: s.string().url()
  ```
- **`.regex(pattern, msg?)`**: Custom regex validation.
  ```typescript
  VERSION: s.string().regex(/^v\d+\.\d+\.\d+$/, "Invalid format")
  ```
- **`.description(text)`**: Adds a description for IDE hover hints.
  ```typescript
  PORT: s.number(3000).description("Server Port")
  ```
- **`.transform(fn)`**: Custom data transformation, supports multi-level piping.
  ```typescript
  NAME: s.string().transform(v => v.trim()).transform(v => v.toUpperCase())
  ```
- **`.from(key)`**: Maps environment variable name (Alias).
  ```typescript
  port: s.number().from('VITE_SERVER_PORT')
  ```
- **`.min(n)` / `.max(n)`**: Constraints for number values.
  ```typescript
  PORT: s.number().min(1024).max(65535)
  ```
- **`.validate(fn, msg?)`**: Fully custom validation logic.
  ```typescript
  INTERNAL_URL: s.string().validate(v => v.endsWith('.internal.com'), 'Must be internal')
  ```

---

### 🎨 Error Reporting
When validation fails, `safe-env` outputs a structured, adaptive table in the console showing: **Key / Error Reason / Current Value (Masked)**.

---

### 📄 License
[MIT License](./LICENSE) - Copyright (c) 2026 Moody.
