# @zh-moody/safe-env 🛡️

[![npm version](https://img.shields.io/npm/v/@zh-moody/safe-env.svg?style=flat-square)](https://www.npmjs.com/package/@zh-moody/safe-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/zhMoody/safe-env?style=flat-square)](https://github.com/zhMoody/safe-env)

简体中文 | [English](./README.en.md)

**告别 `undefined`！在应用启动的第一行，拦截所有配置隐患。**

无论你在写 Vue、React 还是 Node.js，环境变量配置永远是生产事故的高发区。`safe-env` 通过强类型 Schema 校验与运行时保护，确保你的应用始终运行在预期的配置之上。

---

### 🚀 核心特性

- **构建时预校验**：提供 Vite 插件，在开发启动或打包瞬间拦截非法配置。
- **敏感数据脱敏**：支持 `.secret()` 标记，确保密钥等敏感信息不会泄露在日志或报错表格中。
- **运行时深度冻结**：解析后的配置对象默认开启 `Object.freeze`，杜绝任何运行时的非法篡改。
- **Monorepo 精准定位**：支持 `cwd` 参数，可显式指定配置文件检索目录，适配复杂的项目架构。
- **IDE 增强**：支持 `.description()`，在代码中通过悬停直接查看变量用途与文档。
- **严谨的类型解析**：内置 `s.array()`, `s.boolean()` 增强转换，支持 `.transform()` 链式 Pipe 处理。
- **极致轻量**：Gzip 压缩后仅 **1.9 KB**，零运行时依赖。

---

### 📦 安装 (Installation)

```bash
npm install @zh-moody/safe-env
```

---

### 🚀 快速上手

#### 🔹 [Vite / React / Vue] 使用
在前端，建议配合 Vite 插件实现**构建时校验**。

**1. 配置 Vite 插件 (`vite.config.ts`)：**
```typescript
import { viteSafeEnv } from '@zh-moody/safe-env/vite';
import { schema } from './src/env';

export default {
  plugins: [
    viteSafeEnv(schema)
  ]
}
```

**2. 定义配置并导出 (`src/env.ts`)：**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

export const schema = {
  VITE_API_URL: s.string().url().description("后端 API 地址"),
  VITE_PORT: s.number(3000).description("服务端口"),
};

export const env = safeEnv(schema, { 
  source: import.meta.env 
});
```

> **💡 最佳实践：防止 Vite 类型污染**
> 为彻底禁用 `import.meta.env.XXX` 的原生提示，建议修改 `src/vite-env.d.ts`：
> ```typescript
> interface ImportMetaEnv {
>   [key: string]: never;
> }
> ```

---

#### 🔸 [Node.js / 服务端] 使用
在后端环境，库会自动检索并解析磁盘上的 `.env` 系列文件。

**1. 定义配置 (`src/config.ts`)：**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

const config = safeEnv({
  DB_PASSWORD: s.string().secret().description("数据库密码"),
  DB_PORT: s.number(5432).min(1).max(65535),
}, {
  // 在 Monorepo 或特定部署环境下，可显式指定 .env 所在目录
  // cwd: '/path/to/project-root'
});

export default config;
```

---

### 🛠️ API 详解

#### 1. 定义字段 (`s.xxx`)
- `s.string(default?)`: 字符串。若无默认值则必填。
- `s.number(default?)`: 数字。自动转换为 `number` 类型并校验合法性。
- `s.boolean(default?)`: 布尔型。支持将 `"true"`, `"1"`, `"yes"`, `"on"` 解析为 `true`。
- `s.array(default?, separator?)`: 数组型。支持将字符串按分隔符（默认 `,`）拆分为数组。
- `s.enum(options, default?)`: 枚举。值必须在预设数组中。

#### 2. 校验与增强 (链式调用)

每个字段都可以通过链式调用进行深度定制：

- **`.secret()`**: 标记敏感数据，报错时该值会以 `********` 遮罩显示。
  ```typescript
  PASSWORD: s.string().secret()
  ```
- **`.url()` / `.email()`**: 常用格式校验。
  ```typescript
  API_URL: s.string().url()
  ```
- **`.regex(pattern, msg?)`**: 自定义正则校验。
  ```typescript
  VERSION: s.string().regex(/^v\d+\.\d+\.\d+$/, "格式错误")
  ```
- **`.description(text)`**: 添加变量描述，映射到 IDE 悬停提示中。
  ```typescript
  PORT: s.number(3000).description("服务端口")
  ```
- **`.transform(fn)`**: 自定义数据转换，支持多级 Pipe。
  ```typescript
  NAME: s.string().transform(v => v.trim()).transform(v => v.toUpperCase())
  ```
- **`.from(key)`**: 映射环境变量名（别名）。
  ```typescript
  port: s.number().from('VITE_SERVER_PORT')
  ```
- **`.min(n)` / `.max(n)`**: 限制数字取值范围。
  ```typescript
  PORT: s.number().min(1024).max(65535)
  ```
- **`.validate(fn, msg?)`**: 完全自定义的逻辑校验。
  ```typescript
  INTERNAL_URL: s.string().validate(v => v.endsWith('.internal.com'), 'Must be internal')
  ```

---

### 🎨 错误报告
当校验失败时，`safe-env` 会在控制台输出结构化的自适应表格，清晰展示：**Key / 错误原因 / 当前值（已脱敏）**。

---

### 📄 开源协议 (License)
[MIT License](./LICENSE) - Copyright (c) 2026 Moody.
