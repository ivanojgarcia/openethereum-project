// geth-network/scripts/generate-accounts.ts
import { HDNodeWallet, Wallet } from "ethers";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─────────────────────────────────────────────
//  Base project paths (geth-network/)
const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR     = path.join(PROJECT_ROOT, "data");
const ENV_PATH     = path.join(PROJECT_ROOT, ".env");
// ─────────────────────────────────────────────

const PASSWORD = "passw0rd";

type NodeInfo = { idx: number; wallet: HDNodeWallet };
const nodes: NodeInfo[] = Array.from({ length: 4 }, (_, idx) => ({
  idx,
  wallet: Wallet.createRandom(),
}));

console.log(`[DEBUG] Generating keys in ${DATA_DIR}`);

const generateKeys = async () => {
  for (const { idx, wallet } of nodes) {
    const nodeDir     = path.join(DATA_DIR, `node${idx}`);
    const keystoreDir = path.join(nodeDir, "keystore");
    mkdirSync(keystoreDir, { recursive: true });

    // Encrypt wallet with password
    const raw   = await wallet.encrypt(PASSWORD);
    const plain = JSON.parse(raw);
    delete plain["x-ethers"];
    const ts    = new Date().toISOString().replace(/[:.]/g, "-");
    const file  = `UTC--${ts}--${wallet.address.slice(2)}`;
    writeFileSync(path.join(keystoreDir, file), JSON.stringify(plain));

    // address.addr and password.txt
    writeFileSync(path.join(nodeDir, "address.addr"), wallet.address);
    writeFileSync(path.join(nodeDir, "password.txt"), PASSWORD + "\n", { mode: 0o600 });

    console.log(`[DEBUG] NODE GENERATED: <node${idx}> ${wallet.address}`);
    console.log(`[DEBUG] PRIVATE_KEY: <node${idx}> ${wallet.privateKey}`);
  }

  // .env with the validator address (node0)
  writeFileSync(
    ENV_PATH,
    `VALIDATOR_ADDRESS=${nodes[0].wallet.address}\nNODE1_ADDRESS=${nodes[1].wallet.address}\nNODE2_ADDRESS=${nodes[2].wallet.address}\nRPC_ADDRESS=${nodes[3].wallet.address}\nPASSWORD=${PASSWORD}\n`
  );

  console.log("[DEBUG] 4 keystores, password.txt and .env generated correctly.");
};

// Ejecutar la función asíncrona
generateKeys().catch(console.error);
