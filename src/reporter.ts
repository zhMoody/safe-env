import { EnvError } from './types.js';

export function reportErrors(errors: EnvError[]) {
  const RED = '\x1b[31m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const BOLD = '\x1b[1m';
  const RESET = '\x1b[0m';
  const DIM = '\x1b[2m';

  console.error(`\n${RED}${BOLD}❌ SafeEnv Configuration Error${RESET}`);
  console.error(`${DIM}--------------------------------------------------${RESET}`);
  
  // 打印表头
  console.error(`${BOLD}${'FIELD'.padEnd(15)} ${'ERROR'.padEnd(20)} ${'VALUE'}${RESET}`);
  
  for (const err of errors) {
    const displayValue = err.value === undefined ? `${DIM}undefined${RESET}` : `"${err.value}"`;
    console.error(
      `${YELLOW}${err.key.padEnd(15)}${RESET} ` +
      `${RED}${err.error.padEnd(20)}${RESET} ` +
      `${DIM}${displayValue}${RESET}`
    );
  }

  console.error(`${DIM}--------------------------------------------------${RESET}`);
  console.error(`${GREEN}💡 Tip: Check your .env files or system environment variables.${RESET}\n`);
}
