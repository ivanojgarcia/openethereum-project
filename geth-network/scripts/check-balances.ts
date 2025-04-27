#!/usr/bin/env node

/**
 * Script to check the balance of all accounts in the private Ethereum network
 */

import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { formatEther } from 'ethers';
import { JsonRpcProvider } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

const RPC_URL = 'http://localhost:8645';

interface AccountInfo {
  node: string;
  address: string;
  balance: string;
  balanceEth: string;
  containerName: string;
}

// Mapeo de directorios de nodos a nombres de contenedores
function getContainerName(nodeDir: string): string {
  const nodeName = path.basename(nodeDir);
  const nodeIndex = nodeName.replace('node', '');
  
  switch(nodeIndex) {
    case '0':
      return 'eth-node0';
    case '1':
      return 'eth-node1';
    case '2':
      return 'eth-node2';
    case '3':
      return 'eth-rpc';
    default:
      return `eth-${nodeName}`;
  }
}

async function main() {
  try {
    console.log('[DEBUG] Connecting to RPC at', RPC_URL);
    const provider = new JsonRpcProvider(RPC_URL);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 5000ms')), 5000);
    });
    
    const blockNumber = await Promise.race([
      provider.getBlockNumber(),
      timeoutPromise
    ]);
    
    console.log(`[DEBUG] Connected to the network. Current block: ${blockNumber}`);
    
    const accounts: AccountInfo[] = [];
    const nodeDirs = readdirSync(DATA_DIR).filter(dir => dir.startsWith('node'));
    
    console.log('[DEBUG] Getting balances of the accounts...\n');
    
    for (const nodeDir of nodeDirs) {
      const fullNodeDir = path.join(DATA_DIR, nodeDir);
      const addressFile = path.join(fullNodeDir, 'address.addr');
      
      if (readdirSync(fullNodeDir).includes('address.addr')) {
        const address = readFileSync(addressFile, 'utf8').trim();
        const containerName = getContainerName(nodeDir);
        
        const balance = await provider.getBalance(address);
        const balanceEth = formatEther(balance);
        
        accounts.push({
          node: nodeDir,
          address,
          balance: balance.toString(),
          balanceEth,
          containerName
        });
      }
    }
    
    console.log('\n=== ACCOUNT BALANCES ===');
    
    accounts.forEach((account, index) => {
      console.log(`\n${index + 1}. ${account.node.toUpperCase()} [${account.address}]`);
      console.log(`   Container: ${account.containerName}`);
      console.log(`   Balance: ${account.balanceEth} ETH`);
      
      if (parseFloat(account.balanceEth) === 0) {
        console.log('   ⚠️  Zero balance');
      } else if (parseFloat(account.balanceEth) < 0.1) {
        console.log('   ⚠️  Low balance');
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total accounts: ${accounts.length}`);
    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balanceEth), 0);
    console.log(`Total balance: ${totalBalance.toFixed(6)} ETH`);
    
    console.log('\n[DEBUG] Note: If the balances show 0 ETH, ensure that:');
    console.log('1. The private Ethereum network is running (docker-compose up -d)');
    console.log('2. The RPC node is accessible at', RPC_URL);
    console.log('3. The genesis block has assigned funds to these accounts');
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('connecting to node') ||
          error.message.includes('Connection timeout')) {
        console.error('\nIt seems the RPC node is not available. Verify that:');
        console.error('1. The private Ethereum network is running (docker-compose up -d)');
        console.error('2. The RPC node is listening at', RPC_URL);
        console.error('3. Check your docker-compose.yml to confirm the correct RPC port');
        console.error('\nYou can check the container status with: docker-compose ps');
        console.error('And check the logs with: docker-compose logs -f eth-rpc');
      }
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 