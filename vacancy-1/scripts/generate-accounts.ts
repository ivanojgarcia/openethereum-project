// vacancy1/scripts/generate-accounts.ts
import { Wallet, HDNodeWallet } from "ethers";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Obtener la ruta raíz del proyecto (vacancy-1)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
console.log(`Ruta raíz del proyecto: ${PROJECT_ROOT}`);

const PASSWORD   = "passw0rd";
const BASE_DIR   = path.join(PROJECT_ROOT, "data");
const ENV_PATH   = path.join(PROJECT_ROOT, ".env");

type Node = { idx: number; wallet: HDNodeWallet };
const nodes: Node[] = Array.from({ length: 4 }, (_, i) => ({
  idx: i,
  wallet: Wallet.createRandom(),
}));

for (const { idx, wallet } of nodes) {
  const nodeDir      = path.join(BASE_DIR, `node${idx}`);
  const keystoreDir  = path.join(nodeDir, "keystore");
  mkdirSync(keystoreDir, { recursive: true });

  /**
   * Encrypts the private key and saves it in the keystore directory
   */
  const json = await wallet.encrypt(PASSWORD);
  const ts   = new Date().toISOString().replace(/[:.]/g, "-");
  const file = `UTC--${ts}--${wallet.address.slice(2)}`;
  writeFileSync(path.join(keystoreDir, file), json);

  /**
   * Saves the address in plain text (useful for scripts)
   */
  writeFileSync(path.join(nodeDir, "address.addr"), wallet.address);
}

/**
 * Generates .env with the validator address (node0) + password
 */
writeFileSync(
  ENV_PATH,
  `VALIDATOR_ADDRESS=${nodes[0].wallet.address}\nPASSWORD=${PASSWORD}\n`
);

console.log("[DEBUG]4 keystores y .env generados en vacancy-1/data/");
