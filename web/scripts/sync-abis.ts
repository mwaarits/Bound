import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT_DIR = fileURLToPath(new URL('../src/abi/', import.meta.url));
const FORGE_OUT = fileURLToPath(new URL('../../contracts/out/', import.meta.url));

mkdirSync(OUT_DIR, { recursive: true });

for (const name of ['MockIDRX', 'Campaign', 'CampaignFactory']) {
  try {
    const json = JSON.parse(readFileSync(`${FORGE_OUT}${name}.sol/${name}.json`, 'utf-8'));
    writeFileSync(`${OUT_DIR}${name}.abi.ts`, `export const ${name}Abi = ${JSON.stringify(json.abi)} as const;\n`);
    console.log(`synced ${name} ABI (${json.abi.length} entries)`);
  } catch {
    console.log(`skipped ${name} (not built yet)`);
  }
}
