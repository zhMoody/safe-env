import { EnvError } from './types.js';

export function reportErrors(errors: EnvError[]) {
  const c = { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[1m', res: '\x1b[0m', d: '\x1b[2m' };
  
  console.error(`\n${c.r}${c.b}❌ SafeEnv Error${c.res}\n${c.d}${''.padEnd(40, '-')}${c.res}`);
  
  errors.forEach(err => {
    const val = err.value === undefined ? 'undefined' : `"${err.value}"`;
    console.error(`${c.y}${err.key}${c.res} ${c.r}${err.error}${c.res} ${c.d}${val}${c.res}`);
  });

  console.error(`${c.d}${''.padEnd(40, '-')}${c.res}\n${c.g}💡 Check your .env files.${c.res}\n`);
}
