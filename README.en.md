# @zh-moody/safe-env 🛡️

[![npm version](https://img.shields.io/npm/v/@zh-moody/safe-env.svg?style=flat-square)](https://www.npmjs.com/package/@zh-moody/safe-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/zhMoody/safe-env?style=flat-square)](https://github.com/zhMoody/safe-env)

[简体中文](./README.md) | English

**Say goodbye to `undefined`! Intercept all configuration errors at the very first line of your app.**

Whether you are writing Vue, React, or Node.js, environment variable configuration is often a breeding ground for bugs. `safe-env` ensures your application only starts with a valid configuration through strong schema validation.

---

### 🚀 Key Features

- **Build-time Validation**: Provides a Vite plugin to intercept errors during `npm run dev` or `build`, no browser needed.
- **IDE Enhancement**: Supports the `.description()` field to view variable usage via hover in your editor.
- **Strong Data Transformation**: Built-in `s.array()` and `s.boolean()` with advanced `.transform()` chainable pipe support.
- **Built-in Rules**: Provides high-frequency validation like `.url()`, `.email()`, and `.regex()` without depending on Zod.
- **Type Safety**: Automatically infers configuration types with perfect IDE autocompletion.
- **Ultra Lightweight**: Only **1.9 KB** after Gzip, zero runtime dependencies.

---

### 📦 Installation

```bash
npm install @zh-moody/safe-env
# or
pnpm add @zh-moody/safe-env
```

---

### 🛠️ Prerequisites

Create a `.env` file in your project root (this is the source for parsing):

```bash
# .env example
VITE_API_URL=https://api.com
VITE_PORT=3000
VITE_FEATURES=auth,storage
```

---

### 🚀 Quick Start

#### 🔹 [Vite / React / Vue] Usage
For frontend, it is recommended to use the Vite plugin for **build-time validation**.

**1. Configure Vite Plugin (`vite.config.ts`):**
```typescript
import { viteSafeEnv } from '@zh-moody/safe-env/vite';
import { schema } from './src/env'; // Recommended to put schema in a separate file

export default {
  plugins: [
    viteSafeEnv(schema) // Validates at build-time, stops build if config is invalid
  ]
}
```

**2. Define and Export Config (`src/env.ts`):**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

export const schema = {
  VITE_API_URL: s.string().url().description("Backend API Base URL"),
  VITE_PORT: s.number(3000).description("Server Port"),
  VITE_FEATURES: s.array().description("List of enabled features")
};

export const env = safeEnv(schema, { 
  source: import.meta.env 
});
```

---

#### 🔸 [Node.js / Server-side] Usage
For backend, the library automatically looks for and parses `.env` files on disk.

**1. Define Config (`src/config.ts`):**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

const config = safeEnv({
  DB_HOST: s.string('localhost').description("Database Host"),
  DB_PORT: s.number(5432).min(1).max(65535),
  ADMIN_EMAIL: s.string().email()
});

export default config;
```

---

### 🛠️ API Reference

#### 1. Define Fields (`s.xxx`)
- `s.string(default?)`: String. Required if no default is provided.
- `s.number(default?)`: Number. Automatically converts strings to numbers.
- `s.boolean(default?)`: Boolean. Supports parsing `"true"`, `"1"`, `"yes"`, `"on"` as `true` (case-insensitive).
- `s.array(default?, separator?)`: Array. Splits string by separator (default `,`).
- `s.enum(options, default?)`: Enum. Value must be within the provided options.

#### 2. Validation & Enhancements (Chaining)

Every field can be customized using chainable methods:

- **`.url()`**: Validates for a legal URL format.
  ```typescript
  API_URL: s.string().url()
  ```
- **`.email()`**: Validates for a legal email format.
  ```typescript
  CONTACT: s.string().email()
  ```
- **`.regex(pattern, msg?)`**: Custom regex validation.
  ```typescript
  VERSION: s.string().regex(/^v\d+\.\d+\.\d+$/, "Must start with v")
  ```
- **`.description(text)`**: Adds a description, visible via IDE hover.
  ```typescript
  PORT: s.number(3000).description("Local server port")
  ```
- **`.transform(fn)`**: Custom data transformation, supports multi-level piping.
  ```typescript
  // Example 1: Trim and Uppercase
  NAME: s.string().transform(v => v.trim()).transform(v => v.toUpperCase())

  // Example 2: Convert comma-separated string to number array
  SCORES: s.array().transform(arr => arr.map(Number))
  ```
- **`.from(key)`**: Maps to a specific environment variable key (alias).
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

#### 3. Loading Rules (Env Priority)
`safe-env` follows standard priority (lowest to highest):
1. `.env` (Base)
2. `.env.[mode]` (Environment specific, e.g., `.env.development`)
3. `.env.local` (Local override)
4. `.env.[mode].local` (Environment specific local override)

---

### 🎨 Error Reporting
When validation fails, `safe-env` prints a beautiful table showing: **Key / Reason / Current Value**.

---

### 📄 License
[MIT License](./LICENSE) - Copyright (c) 2026 Moody.
