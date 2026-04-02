import { EnvError } from './types.js';

export function reportErrors(errors: EnvError[]) {
  const c = { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[1m', res: '\x1b[0m', d: '\x1b[2m', cy: '\x1b[36m' };
  // 极致精简的截断+填充辅助函数
  const p = (s: any, n: number) => {
    const str = String(s);
    return (str.length > n ? str.slice(0, n - 3) + '...' : str).padEnd(n);
  };

  console.error(`\n${c.r}${c.b}❌ SafeEnv Validation Failed${c.res}`);
  // 表头
  console.error(` ${c.b}${p('Key', 24)} │ ${p('Error', 34)} │ Value${c.res}`);
  console.error(c.d + '─'.repeat(75) + c.res);

  errors.forEach(e => {
    const val = e.isSecret ? '********' : (e.value === undefined ? 'undefined' : `"${e.value}"`);
    const vc = e.isSecret ? c.y : (e.value === undefined ? c.d : c.cy);
    console.error(` ${c.y}${p(e.key, 24)}${c.res} │ ${c.r}${p(e.error, 34)}${c.res} │ ${vc}${p(val, 14)}${c.res}`);
  });

  console.error(c.d + '─'.repeat(75) + c.res);
  console.error(` ${c.g}💡 Tip: Check your .env files or schema definitions.${c.res}\n`);
}
