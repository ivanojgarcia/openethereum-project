import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import dotenv from 'dotenv';
import { defineChain, formatEther } from 'viem';

dotenv.config();
/************************************************
 * 1.  Private keys loading
 ************************************************/
const {
  NODE0_PK,
  NODE1_PK,
  NODE2_PK,
  RPC_PK,
} = process.env;

if (!NODE0_PK || !NODE1_PK || !NODE2_PK || !RPC_PK) {
  throw new Error(
    "[ERROR] Missing some private keys in .env. Add NODE0_PK … RPC_PK."
  );
}

const accounts: string[] = [
  NODE0_PK,
  NODE1_PK,
  NODE2_PK,
  RPC_PK,
];

/************************************************
 * 2.  Chain definition for Geth local network
 ************************************************/

export const gethChain = defineChain({
  id: 1337,
  name: 'Geth Local Network',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8645'] },
    ws: { http: ['http://127.0.0.1:8646'] },
  },
});

/************************************************
 * 3.  Task to show accounts addresses
 ************************************************/

task("accounts", "Shows the available accounts addresses", async (_, hre) => {
  const walletClients = await hre.viem.getWalletClients({
    chain: gethChain
  });
  
  console.log("Accounts addresses:");
  console.log(walletClients.map(client => client.account.address));
});

/************************************************
 * 4.  Task to check account balances
 ************************************************/

task("balances", "Shows the ETH balances of the available accounts", async (_, hre) => {
  const walletClients = await hre.viem.getWalletClients({
    chain: gethChain
  });
  
  const publicClient = await hre.viem.getPublicClient({
    chain: gethChain
  });
  
  console.log("Account balances:");
  
  for (const client of walletClients) {
    const address = client.account.address;
    const balance = await publicClient.getBalance({ address });
    console.log(`${address}: ${formatEther(balance)} ETH`);
  }
});

/************************************************
 * 5.  Hardhat configuration
 ************************************************/

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    gethNetwork: {
      url: "http://127.0.0.1:8645",
      chainId: 1337,
      accounts,
      timeout: 60000,
      gas: 1000000,
      gasPrice: 10000000, // 0.01 gwei
      gasMultiplier: 1,
      blockGasLimit: 2000000
    },
    hardhat: {
      chainId: 31337,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
