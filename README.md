# @zh-moody/safe-env 🛡️

[![npm version](https://img.shields.io/npm/v/@zh-moody/safe-env.svg?style=flat-square)](https://www.npmjs.com/package/@zh-moody/safe-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/zhMoody/safe-env?style=flat-square)](https://github.com/zhMoody/safe-env)

**告别 `undefined`！在应用启动的第一行，拦截所有错误配置。**

无论你在写 Vue、React 还是 Node.js，环境变量配置永远是 Bug 的温床。`safe-env` 通过强类型 Schema 校验，确保你的应用在拥有正确配置的前提下才启动。

---

### 🔗 链接 (Links)

- **GitHub Repository**: [https://github.com/zhMoody/safe-env](https://github.com/zhMoody/safe-env)
- **NPM Package**: [https://www.npmjs.com/package/@zh-moody/safe-env](https://www.npmjs.com/package/@zh-moody/safe-env)

---

### 🚀 核心特性

- **类型安全**：自动推断配置对象类型，拥有完美的 IDE 补全。
- **链式校验**：内置 `min`, `max`, `validate`, `enum` 等校验逻辑。
- **自动前缀**：支持 `VITE_` 或 `REACT_APP_` 自动补全，代码里用 `PORT`，配置里用 `VITE_PORT`。
- **跨端兼容**：自动识别 Node/浏览器环境，支持双端“防御性退出”。
- **极致轻量**：Minified 体积约 **2.6 KB**，Gzip 后仅 **1.3 KB**，零运行时依赖。

---

### 🚀 快速上手

#### 🔹 [Vite / React / Vue] 端使用
在前端，环境变量由构建工具（如 Vite）注入到 `import.meta.env` 中。

**1. 准备 `.env` 文件：**
```bash
VITE_API_URL=https://api.com
VITE_PORT=3000
```

**2. 定义配置 (`src/env.ts`)：**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

export const config = safeEnv({
  apiUrl: s.string().from('VITE_API_URL'), // 别名映射
  port: s.number(3000).from('VITE_PORT'),
}, { 
  source: import.meta.env // ⚠️ 浏览器端必须手动传入数据源
});
```

---

#### 🔸 [Node.js / 服务端] 端使用
在后端，库会自动寻找并解析磁盘上的 `.env` 文件。

**1. 准备 `.env` 文件：**
```bash
DB_HOST=localhost
DB_PORT=5432
```

**2. 定义配置 (`src/db.ts`)：**
```typescript
import { safeEnv, s } from '@zh-moody/safe-env';

const dbConfig = safeEnv({
  DB_HOST: s.string('localhost'),
  DB_PORT: s.number(5432)
}); // ⚠️ Node 端无需传 source，会自动读取文件

export default dbConfig;
```

---

### 📂 核心对比：Schema 与 .env 对应关系

| Schema 定义 | .env 中的写法 | 结果 |
| :--- | :--- | :--- |
| `s.string()` | `KEY=val` | ✅ 通过 |
| `s.string()` | *(未填写)* | ❌ **报错并拦截启动** |
| `s.string('App')` | `KEY=` (留空) | ✅ 自动降级为 `'App'` |
| `s.number()` | `KEY=abc` | ❌ **报错：Invalid number** |

---

### 🛠️ API 详解

#### 1. 定义字段 (`s.xxx`)
- `s.string(default?)`: 字符串。若无默认值则必填。
- `s.number(default?)`: 数字。自动将字符串转为 `number`。
- `s.boolean(default?)`: 布尔。将 `"true"` 解析为 `true`。
- `s.enum(options, default?)`: 枚举。值必须在数组中。
  - 示例：`s.enum(['dev', 'prod'], 'dev')`

#### 2. 增强校验 (链式调用)
每个通过 `s` 定义的字段都可以调用以下方法进行增强：

- **`.from(key)`**: 指定环境变量名。
  ```typescript
  // 即使变量叫 VITE_PATH，代码里也可以叫 port
  port: s.number().from('VITE_PATH')
  ```

- **`.min(n)` / `.max(n)`**: 限制数字取值范围。
  ```typescript
  // 端口必须在 1-65535 之间
  PORT: s.number().min(1).max(65535)
  ```

- **`.validate(fn, msg?)`**: 自定义校验（如：邮箱、URL 格式）。
  ```typescript
  // 必须是安全地址
  API: s.string().validate(v => v.startsWith('https'), 'Must be HTTPS')
  ```

#### 3. 加载选项 (`SafeEnvOptions`)

| 选项 | 适用环境 | 说明 |
| :--- | :--- | :--- |
| `source` | **[Vite/浏览器]** | **必填**。传入 `import.meta.env` 或 `process.env`。 |
| `prefix` | **通用** | **可选**。自动补全前缀，如 `prefix: 'VITE_'`。 |
| `mode` | **[Node.js]** | **可选**。指定模式（dev/prod）以加载对应的 `.env.prod` 等文件。 |
| `loadProcessEnv` | **[Node.js]** | **可选**。是否加载系统环境变量，默认 `true`。 |

---

### 🎨 错误报告：长什么样？

当校验失败时，`safe-env` 会在控制台打印一个显眼的表格，告诉你哪个字段错了、原因是什么以及当前的值。在浏览器中这会抛出一个 Error 阻止应用启动，在 Node.js 中会直接 `process.exit(1)`。

---

### 📦 跨平台支持
- **前端**: Vite (Vue/React/Vanilla)。
- **后端**: Node.js (ESM/CJS)。

---

### 📄 开源协议 (License)

[MIT License](./LICENSE) - Copyright (c) 2025 Moody.
