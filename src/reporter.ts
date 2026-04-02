import { EnvError } from './types.js';

export function reportErrors(errors: EnvError[]) {
  const c = { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[1m', res: '\x1b[0m', d: '\x1b[2m', cy: '\x1b[36m' };
  
  // 核心：自适应宽度分配 (最小 80 列)
  const total = Math.max(80, process.stdout.columns || 80) - 10;
  const K = Math.floor(total * 0.3), E = Math.floor(total * 0.5);

  // 辅助函数：计算视觉宽度并对齐
  const p = (s: any, n: number) => {
    let r = String(s);
    // 视觉宽度计算：中文字符计为 2
    const w = () => r.length + (r.match(/[^\x00-\xff]/g) || []).length;
    while (w() > n) r = r.slice(0, -1);
    return r + ' '.repeat(n - w());
  };

  console.error(`\n${c.r}${c.b}❌ SafeEnv Validation Failed${c.res}`);
  console.error(` ${c.b}${p('Key', K)} │ ${p('Error', E)} │ Value${c.res}`);
  console.error(c.d + '─'.repeat(total + 5) + c.res);

  errors.forEach(e => {
    const val = e.isSecret ? '********' : (e.value === undefined ? 'undefined' : `"${e.value}"`);
    const vc = e.isSecret ? c.y : (e.value === undefined ? c.d : c.cy);
    console.error(` ${c.y}${p(e.key, K)}${c.res} │ ${c.r}${p(e.error, E)}${c.res} │ ${vc}${val}${c.res}`);
  });

  console.error(c.d + '─'.repeat(total + 5) + c.res);
  console.error(` ${c.g}💡 Tip: Check your .env files or schema definitions.${c.res}\n`);
}
