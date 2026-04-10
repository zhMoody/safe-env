# @zh-moody/safe-env 🛡️

[![npm version](https://img.shields.io/npm/v/@zh-moody/safe-env.svg?style=flat-square)](https://www.npmjs.com/package/@zh-moody/safe-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/zhMoody/safe-env?style=flat-square)](https://github.com/zhMoody/safe-env)

[简体中文](./README.md) | English

**Say goodbye to `undefined`! Intercept all configuration hazards on the first line of your app.**

Whether you're building with Vue, React, or Node.js, environment variables are often the root of production incidents. `safe-env` ensures your application always runs on top of expected configurations through strong schema validation and runtime protection.

---

![](./assets/demo.gif)

---

### 🚀 Key Features

- **Build-time Pre-validation**: Vite plugin intercepts invalid configurations during dev startup or build.
- **Sensitive Data Masking**: Supports `.secret()` to ensure keys/tokens are masked in logs or error reports.
- **Runtime Lazy Protection**: ⚡ **HPC Ready**. Powered by **Lazy Proxy**, achieving $O(1)$ startup latency and on-demand read-only protection.
- **Monorepo Ready**: Explicitly specify `.env` search directories via `cwd`, fitting complex architectures.
- **IDE Enhancement**: `.description()` allows you to view variable purposes/documentation via hover.
- **Robust Parsing**: Built-in `s.array()`, `s.boolean()` with intelligent conversion and `.transform()` pipe processing.

---

### 📦 Installation

```bash
npm install @zh-moody/safe-env
```

---

### 🚀 Quick Start

Ensure you have a **`.env`** file in your project root before starting:

```bash
# .env example
VITE_API_URL=https://api.example.com
VITE_PORT=8080
```

#### 🔹 [Vite / React / Vue] Usage

**1. Configure Vite Plugin (`vite.config.ts`):**

```typescript
import { viteSafeEnv } from "@zh-moody/safe-env/vite";
import { schema } from "./src/env";

export default {
  plugins: [viteSafeEnv(schema)],
};
```

**2. Define and Export Schema (`src/env.ts`):**

```typescript
import { safeEnv, s, isUrl } from "@zh-moody/safe-env";

export const schema = {
  VITE_API_URL: s.string().validate(isUrl, "Invalid URL").description("Backend API endpoint"),
  VITE_PORT: s.number(3000).description("Server port"),
};

export const env = safeEnv(schema, {
  source: import.meta.env,
});
```

---

#### 🔸 [Node.js / Server-side] Usage

**1. Define Configuration (`src/config.ts`):**

```typescript
import { safeEnv, s } from "@zh-moody/safe-env";

const config = safeEnv(
  {
    DB_PASSWORD: s.string().secret().description("Database password"),
    DB_PORT: s.number(5432).min(1).max(65535),
  },
  {
    // Explicitly specify .env root in Monorepo or deployment environments
    // cwd: '/path/to/project-root'
  },
);

export default config;
```

---

### 🛠️ API Reference

#### 1. Global Options (`safeEnv`)

`safeEnv(schema, options?)` accepts an optional object to control the parsing engine:

- **`useCache (boolean)`**: Enable global memoization (default `true`). Significantly improves performance for high-frequency calls.
- **`refreshCache (boolean)`**: Force flush and re-read disk/process variables (default `false`). Essential for HMR or switching envs in automated tests.
- **`cwd (string)`**: Specify the search root for `.env` files (Node.js).
- **`source (Record<string, any>)`**: Manually provide the data source (e.g., `import.meta.env`), skipping automatic file retrieval.
- **`prefix (string)`**: Filter prefix for env variables (default `VITE_`).

#### 2. Field Definitions (`s.xxx`)

- **`s.string(default?)`**: 
  - **Logic**: If no default is provided, it's marked as **Required**.
- **`s.number(default?)`**: 
  - **Logic**: Executes `Number(v)`. Aborts with an error if result is `NaN` (e.g., `VITE_PORT=abc`).
- **`s.boolean(default?)`**: Intelligent Boolean parsing.
  - **Logic**: 
    - **`true`**: `true`, `"true"`, `"1"`, `"yes"`, `"on"`.
    - **`false`**: `false`, `"false"`, `"0"`, `"no"`, `"off"`, or empty strings.
- **`s.array(default?, separator?)`**: 
  - **Logic**: Default separator is `,`. Supports custom ones like `s.array([], '|')`.
- **`s.enum(options, default?)`**: 
  - **Logic**: Input must be one of the `options`. Perfect for mode locking (`dev`, `prod`, `test`).

#### 3. Enhancements & Validation (Chaining)

- **`.secret()`**: Mask sensitive data in error reports (`********`).
  ```typescript
  PASSWORD: s.string().secret();
  ```
- **`.description(text)`**: Hover hints for IDEs.
  ```typescript
  PORT: s.number(3000).description("Server port");
  ```
- **`.optional()`**: Explicitly declare this field as optional. Missing values drop back to `undefined` instead of throwing an error.
  ```typescript
  TRACKING_ID: s.string().optional();
  ```
- **`.requiredIf(fn)`**: Context-Aware validation. Dynamically determine if the field is required based on values parsed so far.
  ```typescript
  // ICP_NUMBER is required ONLY if parsed REGION equals 'CN'
  ICP_NUMBER: s.string().requiredIf((ctx) => ctx.parsed.REGION === 'CN');
  ```
- **`.transform(fn)`**: Custom data transformation (Multi-level pipe).
  ```typescript
  NAME: s.string()
    .transform((v) => v.trim())
    .transform((v) => v.toUpperCase());
  ```
- **`.from(key)`**: Alias mapping (Environment key mapping).
  ```typescript
  port: s.number().from("VITE_SERVER_PORT");
  ```
- **`.min(n)` / `.max(n)`**: Number range constraints.
  ```typescript
  PORT: s.number().min(1024).max(65535);
  ```
- **`.validate(fn, msg?)`**: Custom logic validation. Supports context passing and native pure-function integration (See "Built-in Validation Rules").
  ```typescript
  INTERNAL_URL: s.string().validate(
    (v, ctx) => v.endsWith(".internal.com"),
    "Must be internal",
  );
  ```

#### 4. Built-in Validation Rules

To support an infinite amount of business validation logic without blowing up bundle sizes, all heavy string validators (like Regex) and transformers are separated from the core class. They are instead provided as **pure, perfectly tree-shakable higher-order functions** that can be imported directly.

Seamlessly integrate them using native `validate`/`transform` methods:

```typescript
import { safeEnv, s, isUrl, isIPv4, isUUID, isJSON, toJSON, trim } from "@zh-moody/safe-env";

const schema = {
  // Dirty data processing: Trim whitespaces, then validate IPv4
  HOST: s.string().transform(trim).validate(isIPv4, "Must be valid IPv4"),
  // Serialization mapping natively
  PAYLOAD: s.string().validate(isJSON).transform(toJSON),
  // Common URL link checking
  API_URL: s.string().validate(isUrl, "Must be a valid URL")
};
```

Currently, `@zh-moody/safe-env` exports the following utility functions out-of-the-box:
- **Validators**: `isUrl`, `isEmail`, `isIPv4`, `isUUID`, `isBase64`, `isJSON`, `isHexColor`, `isObjectId`, `matchesRegex(pattern)`
- **Transformers**: `trim`, `toLowerCase`, `toUpperCase`, `toJSON`

---

### 🎨 Error Reporting

When validation fails, `safe-env` outputs an adaptive structured table showing: **Key / Error / Current Value (Masked)**.

---

### 📄 License

[MIT License](./LICENSE) - Copyright (c) 2026 Moody.
