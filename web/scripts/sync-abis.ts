import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const CONTRACTS = ['MockIDRX', 'Campaign', 'CampaignFactory'];
const OUT_DIR = fileURLToPath(new URL('../src/abi/', import.meta.url));
const FORGE_OUT = fileURLToPath(new URL('../../../contracts/out/', import.meta.url));

mkdirSync(OUT_DIR, { recursive: true });

for (const name of CONTRACTS) {
  try {
    const json = JSON.parse(readFileSync(`${FORGE_OUT}${name}.sol/${name}.json`, 'utf-8'));
    const abi = json.abi;
    writeFileSync(
      `${OUT_DIR}${name}.abi.ts`,
      `export const ${name}Abi = ${JSON.stringify(abi)} as const;\n`
    );
    console.log(`synced ${name} ABI (${abi.length} entries)`);
  } catch {
    console.log(`skipped ${name} (not built yet)`);
  }
}
