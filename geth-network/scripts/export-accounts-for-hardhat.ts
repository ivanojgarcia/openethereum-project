// geth-network/scripts/extract-private-keys.ts
import { Wallet } from "ethers";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR     = path.join(PROJECT_ROOT, "data");
const OUT_ENV      = path.join(PROJECT_ROOT, ".env.keys");

const PASSWORD = "passw0rd";

async function main() {
  const lines: string[] = [];

  for (let idx = 0; idx < 4; idx++) {
    const nodeDir     = path.join(DATA_DIR, `node${idx}`);
    const addrFile    = path.join(nodeDir, "address.addr");
    if (!readFileSync(addrFile, "utf8")) {
      throw new Error(`[ERROR] File ${addrFile} does not exist`);
    }
    const address     = readFileSync(addrFile, "utf8").trim();
    const bareAddr    = address.toLowerCase().replace(/^0x/, "");

    const ksDir       = path.join(nodeDir, "keystore");
    const jsonFiles   = readdirSync(ksDir).filter(f =>
      f.toLowerCase().includes(bareAddr)
    );
    if (jsonFiles.length === 0) {
      throw new Error(`[ERROR] Missing JSON-keystore for ${address} in node${idx}`);
    }
    const jsonPath = path.join(ksDir, jsonFiles[0]);
    const encrypted= readFileSync(jsonPath, "utf8");
    const wallet   = await Wallet.fromEncryptedJson(encrypted, PASSWORD);
    const pk       = wallet.privateKey; // 0x...

    const varName  = idx === 3 ? "RPC_PK" : `NODE${idx}_PK`;
    lines.push(`${varName}=${pk}`);
    console.log(`[DEBUG] node${idx}: ${varName}=${pk}`);
  }

  writeFileSync(OUT_ENV, lines.join("\n") + "\n", { mode: 0o600 });
  console.log(`[DEBUG] Private keys written to ${OUT_ENV}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
