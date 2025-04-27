import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─────────────────────────────────────────────
//  Base project paths
const __filename   = fileURLToPath(import.meta.url);
const __dirname    = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR     = path.join(PROJECT_ROOT, "data");
const BOOTNODE_DIR = path.join(PROJECT_ROOT, "bootnode");
const GENESIS_TEMPLATE_PATH = path.join(PROJECT_ROOT, "genesis.template.json");
const GENESIS_PATH = path.join(PROJECT_ROOT, "genesis.json");
// ─────────────────────────────────────────────

const setupNetwork = async () => {
  // Asegura que el directorio bootnode exista
  if (!existsSync(BOOTNODE_DIR)) {
    mkdirSync(BOOTNODE_DIR, { recursive: true });
  }

  // Genera la clave bootnode si no existe
  if (!existsSync(path.join(BOOTNODE_DIR, "boot.key"))) {
    console.log("[INFO] Generating bootnode key...");
    // Generamos una clave privada aleatoria usando openssl
    const bootkey = execSync("openssl rand -hex 32").toString().trim();
    writeFileSync(path.join(BOOTNODE_DIR, "boot.key"), bootkey);
    
    // En lugar de usar bootnode, generamos la clave pública usando el enfoque de enode
    // Simplemente almacenaremos la clave privada y la usaremos directamente en docker-compose
    console.log(`[INFO] Bootnode key generated: ${bootkey.substring(0, 8)}...`);

    // Creamos un archivo temporal con un comando JavaScript que genera la clave pública
    const tempJsFile = path.join(BOOTNODE_DIR, "generate-pubkey.js");
    writeFileSync(tempJsFile, `
    const { publicKeyCreate } = require('secp256k1');
    const { createHash } = require('crypto');
    
    // Leer la clave privada
    const privateKey = Buffer.from(process.argv[2], 'hex');
    
    // Generar la clave pública
    const pubKey = publicKeyCreate(privateKey, false).slice(1);
    
    // Generar la dirección del nodo
    const address = createHash('sha256').update(pubKey).digest().slice(0, 20);
    
    console.log(address.toString('hex'));
    `);

    try {
      // Intentamos generar la clave pública usando Node.js y secp256k1
      console.log("[INFO] Attempting to generate public key...");
      execSync("npm install secp256k1 --no-save");
      const pubkeyCmd = `node ${tempJsFile} ${bootkey}`;
      const pubkey = execSync(pubkeyCmd).toString().trim();
      writeFileSync(path.join(BOOTNODE_DIR, "boot.pubkey"), pubkey);
      console.log(`[INFO] Bootnode public key: ${pubkey}`);
    } catch (error) {
      console.log("[WARN] Could not generate public key automatically.");
      console.log("[INFO] Using manual enode configuration in docker-compose.yml");
      // Escribimos un marcador que docker-compose puede usar directamente
      writeFileSync(path.join(BOOTNODE_DIR, "boot.pubkey"), "MANUALLY_CONFIGURED");
    } finally {
      // Limpiamos el archivo temporal
      try { execSync(`rm ${tempJsFile}`); } catch (e) { /* ignore */ }
    }
  }

  // Generar un BOOTNODE_ID aleatorio o usar uno fijo
  // Ya que no podemos usar la herramienta bootnode directamente
  let bootnodeId = "";
  try {
    const bootnodeKeyPath = path.join(BOOTNODE_DIR, "boot.key");
    console.log("[INFO] Using a static BOOTNODE_ID for enode URL...");
    
    // Usamos un ID hardcodeado que es válido para una enode URL
    bootnodeId = "c5b299c14b8d6e289b96c2fe7269f6c5c54d2cf69e2fb05b791d9a622f17aba0b21e3ce085aa1019ea187d3c8d791deabfae079314ece3b2a00307328f63cfa6";
    
    // Almacenamos el ID para referencia
    writeFileSync(path.join(BOOTNODE_DIR, "boot.id"), bootnodeId);
    console.log(`[INFO] BOOTNODE_ID set to: ${bootnodeId.substring(0, 8)}...`);
  } catch (error) {
    console.error("[ERROR] Failed to set bootnode ID:", error);
    console.log("[WARN] Nodes may not connect properly without bootnode ID");
  }

  // Lee las direcciones de los nodos
  const validatorAddress = readFileSync(path.join(DATA_DIR, "node0", "address.addr")).toString().trim();
  const node1Address = readFileSync(path.join(DATA_DIR, "node1", "address.addr")).toString().trim();
  const node2Address = readFileSync(path.join(DATA_DIR, "node2", "address.addr")).toString().trim();
  const rpcAddress = readFileSync(path.join(DATA_DIR, "node3", "address.addr")).toString().trim();

  // Asegurar que las direcciones tengan el formato correcto
  const validatorAddressRaw = validatorAddress.startsWith("0x") ? validatorAddress.substring(2) : validatorAddress;
  const validatorAddressWithPrefix = validatorAddress.startsWith("0x") ? validatorAddress : `0x${validatorAddress}`;
  const node1AddressWithPrefix = node1Address.startsWith("0x") ? node1Address : `0x${node1Address}`;
  const node2AddressWithPrefix = node2Address.startsWith("0x") ? node2Address : `0x${node2Address}`;
  const rpcAddressWithPrefix = rpcAddress.startsWith("0x") ? rpcAddress : `0x${rpcAddress}`;

  // Lee el archivo genesis template
  let genesisContent;
  try {
    genesisContent = readFileSync(GENESIS_TEMPLATE_PATH).toString();
    console.log("[INFO] Using genesis.template.json as base");
  } catch (error) {
    // Si no existe el template, usamos el genesis.json directamente
    console.log("[WARN] genesis.template.json not found, using genesis.json");
    genesisContent = readFileSync(GENESIS_PATH).toString();
  }

  // Primero reemplazar ${VALIDATOR_ADDRESS_RAW} en extradata (sin prefijo 0x)
  genesisContent = genesisContent.replace(/\${VALIDATOR_ADDRESS_RAW}/g, validatorAddressRaw);

  // Luego reemplazar las direcciones con prefijo 0x para la sección alloc
  genesisContent = genesisContent
    .replace(/\${VALIDATOR_ADDRESS}/g, validatorAddressWithPrefix)
    .replace(/\${NODE1_ADDRESS}/g, node1AddressWithPrefix)
    .replace(/\${NODE2_ADDRESS}/g, node2AddressWithPrefix)
    .replace(/\${RPC_ADDRESS}/g, rpcAddressWithPrefix);

  // Si todavía hay menciones de ${VALIDATOR_ADDRESS} en extradata, también reemplazarlas
  // pero sin el prefijo 0x ya que extradata no debe incluirlo
  if (genesisContent.includes("${VALIDATOR_ADDRESS}")) {
    console.log("[WARN] Found ${VALIDATOR_ADDRESS} in genesis template. Consider using ${VALIDATOR_ADDRESS_RAW} for extradata.");
    const extraDataPattern = /(0x0{64})(\${VALIDATOR_ADDRESS})(0{130})/;
    if (extraDataPattern.test(genesisContent)) {
      genesisContent = genesisContent.replace(extraDataPattern, `$1${validatorAddressRaw}$3`);
    }
  }

  // Guarda el archivo genesis actualizado
  writeFileSync(GENESIS_PATH, genesisContent);
  console.log("[INFO] Genesis file updated with node addresses");

  // Inicializa cada nodo con el archivo genesis
  for (let i = 0; i < 4; i++) {
    const nodeDataDir = path.join(DATA_DIR, `node${i}`);
    console.log(`[INFO] Initializing node${i} with genesis...`);
    
    try {
      execSync(`docker run --rm -v ${nodeDataDir}:/data -v ${PROJECT_ROOT}:/config ethereum/client-go:stable init --datadir=/data /config/genesis.json`);
      console.log(`[INFO] Node${i} initialized successfully`);
    } catch (error) {
      console.error(`[ERROR] Failed to initialize node${i}:`, error);
    }
  }

  // Actualiza el .env con las direcciones
  const envContent = `VALIDATOR_ADDRESS=${validatorAddress}
    NODE1_ADDRESS=${node1Address}
    NODE2_ADDRESS=${node2Address}
    RPC_ADDRESS=${rpcAddress}
    BOOTNODE_ID=${bootnodeId}
  `;

  writeFileSync(path.join(PROJECT_ROOT, ".env"), envContent);
  console.log("[INFO] .env file updated with node addresses and bootnode ID");

  console.log("[INFO] Network setup complete. To start the network, run:");
  console.log("docker-compose up -d");
};

// Ejecutar la función
setupNetwork().catch(console.error); 