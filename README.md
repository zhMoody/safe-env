# @zh-moody/safe-env 🛡️

[![npm version](https://img.shields.io/npm/v/@zh-moody/safe-env.svg?style=flat-square)](https://www.npmjs.com/package/@zh-moody/safe-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/zhMoody/safe-env?style=flat-square)](https://github.com/zhMoody/safe-env)

**告别 `undefined`！在应用启动的第一行，拦截所有错误配置。**

无论你在写 Vue、React 还是 Node.js，环境变量配置永远是 Bug 的温床。`safe-env` 通过强类型 Schema 校验，确保你的应用在拥有正确配置的前提下才启动。

---

### 🚀 核心特性

- **构建时预校验**：提供 Vite 插件，在 `npm run dev` 或 `build` 的瞬间拦截错误，无需打开浏览器。
- **IDE 增强**：支持 `.description()` 字段，直接在代码中通过悬停查看变量用途。
- **更强的数据转换**：内置 `s.array()`, `s.boolean()` 增强转换，支持 `.transform()` 链式 Pipe 处理。
- **内置常用规则**：提供 `.url()`, `.email()`, `.regex()` 等高频校验，无需依赖 zod。
- **类型安全**：自动推断配置对象类型，拥有完美的 IDE 补全。
- **极致轻量**：Gzip 压缩后仅 **1.9 KB**，零运行时依赖。

---

### 🚀 快速上手

#### 🔹 [Vite / React / Vue] 使用
在前端，建议配合 Vite 插件实现**构建时校验**。

**1. 配置 Vite 插件 (`vite.config.ts`)：**
```typescript
import { viteSafeEnv } from '@zh-moody/safe-env/vite';
import { schema } from './src/env'; // 建议将 schema 提取到独立文件

export default {
  plugins: [
    viteSafeEnv(schema) // 构建时校验，配置错误直接停止构建
  ]
}
```

**2. 定义配置并导出 (`src/env.ts`)：**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

export const schema = {
  VITE_API_URL: s.string().url().description("后端 API 地址"),
  VITE_PORT: s.number(3000).description("服务端口"),
  VITE_FEATURES: s.array().description("启用的特性列表")
};

export const env = safeEnv(schema, { 
  source: import.meta.env 
});
```

---

#### 🔸 [Node.js / 服务端] 使用
在后端，库会自动寻找并解析磁盘上的 `.env` 文件。

**1. 定义配置 (`src/config.ts`)：**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

const config = safeEnv({
  DB_HOST: s.string('localhost').description("数据库主机"),
  DB_PORT: s.number(5432).min(1).max(65535),
  ADMIN_EMAIL: s.string().email()
});

export default config;
```

---

### 🛠️ API 详解

#### 1. 定义字段 (`s.xxx`)
- `s.string(default?)`: 字符串。若无默认值则必填。
- `s.number(default?)`: 数字。自动将字符串转为 `number`。
- `s.boolean(default?)`: 布尔型。支持将 `"true"`, `"1"`, `"yes"`, `"on"` 解析为 `true`（大小写无关）。
- `s.array(default?, separator?)`: 数组型。支持将字符串按分隔符（默认 `,`）拆分为数组。
- `s.enum(options, default?)`: 枚举。值必须在数组中。

#### 2. 校验与增强 (链式调用)

每个字段都可以通过链式调用进行深度定制：

- **`.url()`**: 校验是否为合法 URL 格式。
  ```typescript
  API_URL: s.string().url()
  ```
- **`.email()`**: 校验是否为合法邮箱格式。
  ```typescript
  CONTACT: s.string().email()
  ```
- **`.regex(pattern, msg?)`**: 自定义正则校验。
  ```typescript
  VERSION: s.string().regex(/^v\d+\.\d+\.\d+$/, "版本号必须以 v 开头")
  ```
- **`.description(text)`**: 添加变量描述。该描述会映射到 IDE 的悬停提示中。
  ```typescript
  PORT: s.number(3000).description("本地服务器端口")
  ```
- **`.transform(fn)`**: 自定义数据转换，支持多级链式 Pipe。
  ```typescript
  // 示例 1: 拿到字符串 -> 去空格 -> 转大写
  NAME: s.string().transform(v => v.trim()).transform(v => v.toUpperCase())

  // 示例 2: 将逗号分隔的数字字符串转为数字数组
  SCORES: s.array().transform(arr => arr.map(Number))
  ```
- **`.from(key)`**: 映射环境变量名（别名）。
  ```typescript
  // 即使环境变量叫 VITE_SERVER_PORT，代码里也可以叫 port
  port: s.number().from('VITE_SERVER_PORT')
  ```
- **`.min(n)` / `.max(n)`**: 限制数字取值范围。
  ```typescript
  // 端口必须在 1024-65535 之间
  PORT: s.number().min(1024).max(65535)
  ```
- **`.validate(fn, msg?)`**: 完全自定义的校验逻辑。
  ```typescript
  // 必须是特定的内部域名
  INTERNAL_URL: s.string().validate(v => v.endsWith('.internal.com'), 'Must be an internal URL')
  ```

#### 3. 加载规则 (Env Priority)
`safe-env` 遵循标准的优先级顺序（从低到高）：
1. `.env` (基础配置)
2. `.env.[mode]` (环境配置，如 `.env.development`)
3. `.env.local` (本地覆盖)
4. `.env.[mode].local` (环境特定的本地覆盖)

---

### 🎨 错误报告
当校验失败时，`safe-env` 会在控制台打印精美的表格，清晰展示：**Key / 错误原因 / 当前值**。

---

### 📄 开源协议 (License)
[MIT License](./LICENSE) - Copyright (c) 2026 Moody.
