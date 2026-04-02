import { EnvError } from './types.js';

export function reportErrors(errors: EnvError[]) {
  const c = { 
    r: '\x1b[31m', 
    g: '\x1b[32m', 
    y: '\x1b[33m', 
    b: '\x1b[1m', 
    res: '\x1b[0m', 
    d: '\x1b[2m',
    cyan: '\x1b[36m'
  };
  
  console.error(`\n${c.r}${c.b}❌ SafeEnv Validation Failed${c.res}`);
  console.error(`${c.d}${''.padEnd(60, '─')}${c.res}`);
  
  // 表头
  const head = ` ${'Key'.padEnd(25)} │ ${'Error'.padEnd(20)} │ ${'Value'}`;
  console.error(`${c.b}${head}${c.res}`);
  console.error(`${c.d}${''.padEnd(26, '─')}┬${''.padEnd(22, '─')}┬${''.padEnd(10, '─')}${c.res}`);

  errors.forEach(err => {
    const key = err.key.length > 24 ? err.key.slice(0, 21) + '...' : err.key.padEnd(25);
    const errorMsg = err.error.length > 19 ? err.error.slice(0, 16) + '...' : err.error.padEnd(20);
    const val = err.value === undefined ? `${c.d}undefined${c.res}` : `${c.cyan}"${err.value}"${c.res}`;
    
    console.error(` ${c.y}${key}${c.res} │ ${c.r}${errorMsg}${c.res} │ ${val}`);
  });

  console.error(`${c.d}${''.padEnd(60, '─')}${c.res}`);
  console.error(` ${c.g}💡 Tip: Check your .env files or schema definitions.${c.res}\n`);
}
