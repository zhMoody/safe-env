import fs from 'node:fs';
import path from 'node:path';
import { parseDotEnv } from './dotenv.js';

export function loadDotEnv(filePath = ".env"): Record<string, string> {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      return parseDotEnv(fs.readFileSync(fullPath, "utf-8"));
    }
  } catch (err) {
    // ignore
  }
  return {};
}
