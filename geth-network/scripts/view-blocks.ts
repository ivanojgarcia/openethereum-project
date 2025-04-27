#!/usr/bin/env node

/**
 * Script to view blocks in the private Ethereum network
 */

import { JsonRpcProvider } from 'ethers';
import { formatEther, formatUnits } from 'ethers';

// Configuration
const RPC_URL = 'http://localhost:8645';
const DEFAULT_BLOCKS_TO_SHOW = 10;

interface Block {
  number: number;
  hash: string;
  timestamp: number;
  date: Date;
  transactions: any[];
  gasUsed: bigint;
  gasLimit: bigint;
  miner: string;
  baseFeePerGas?: bigint;
}

/**
 * Format date in a readable format
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Get details of a specific block
 */
async function getBlockDetails(provider: JsonRpcProvider, blockNumber: number): Promise<Block | null> {
  try {
    const block = await provider.getBlock(blockNumber, true);
    if (!block) return null;

    return {
      number: block.number,
      hash: block.hash || '',
      timestamp: block.timestamp,
      date: new Date(block.timestamp * 1000),
      transactions: Array.isArray(block.transactions) ? [...block.transactions] : [],
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      miner: block.miner || '',
      baseFeePerGas: block.baseFeePerGas || undefined
    };
  } catch (error) {
    console.error(`Error getting block ${blockNumber}:`, error);
    return null;
  }
}

/**
 * Display block information in a nice format
 */
function displayBlock(block: Block): void {
  console.log('\n===============================================');
  console.log(`BLOCK #${block.number}`);
  console.log('===============================================');
  console.log(`Hash: ${block.hash}`);
  console.log(`Timestamp: ${block.timestamp} (${formatDate(block.timestamp)})`);
  console.log(`Miner: ${block.miner}`);
  console.log(`Gas Used: ${block.gasUsed.toString()} (${(Number(block.gasUsed) * 100 / Number(block.gasLimit)).toFixed(2)}%)`);
  console.log(`Gas Limit: ${block.gasLimit.toString()}`);
  
  if (block.baseFeePerGas) {
    console.log(`Base Fee: ${formatUnits(block.baseFeePerGas, "gwei")} Gwei`);
  }

  if (block.transactions.length > 0) {
    console.log(`\nTransactions: ${block.transactions.length}`);
    block.transactions.forEach((tx, index) => {
      if (typeof tx === 'string') {
        console.log(`  ${index + 1}. ${tx}`);
      } else {
        console.log(`  ${index + 1}. From: ${tx.from} To: ${tx.to || 'Contract Creation'}`);
        console.log(`     Value: ${formatEther(tx.value || 0)} ETH  Gas: ${tx.gasLimit.toString()}`);
        console.log(`     Hash: ${tx.hash}`);
      }
    });
  } else {
    console.log('\nTransactions: None');
  }
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let blocksToShow = DEFAULT_BLOCKS_TO_SHOW;
  let specificBlock: number | null = null;

  // Check if there's a specific block number
  if (args.length > 0) {
    const firstArg = args[0];
    if (firstArg === '-h' || firstArg === '--help') {
      console.log('Usage:');
      console.log('  npx ts-node scripts/view-blocks.ts               # Show last 10 blocks');
      console.log('  npx ts-node scripts/view-blocks.ts 20            # Show last 20 blocks');
      console.log('  npx ts-node scripts/view-blocks.ts -b 42         # Show specific block #42');
      console.log('  npx ts-node scripts/view-blocks.ts --block 42    # Show specific block #42');
      console.log('  npx ts-node scripts/view-blocks.ts -h, --help    # Show this help');
      process.exit(0);
    } else if (firstArg === '-b' || firstArg === '--block') {
      if (args.length > 1) {
        specificBlock = parseInt(args[1], 10);
      } else {
        console.error('Error: Block number not provided after -b/--block option');
        process.exit(1);
      }
    } else {
      // Try to parse as number of blocks to show
      const num = parseInt(firstArg, 10);
      if (!isNaN(num)) {
        blocksToShow = num;
      }
    }
  }

  try {
    console.log('Connecting to Ethereum node at', RPC_URL);
    const provider = new JsonRpcProvider(RPC_URL);
    
    // Get the current block number
    const latestBlockNumber = await provider.getBlockNumber();
    console.log(`Latest block: #${latestBlockNumber}`);

    if (specificBlock !== null) {
      // Show specific block
      if (specificBlock > latestBlockNumber) {
        console.error(`Error: Block #${specificBlock} doesn't exist yet. Latest block is #${latestBlockNumber}`);
        process.exit(1);
      }

      const block = await getBlockDetails(provider, specificBlock);
      if (block) {
        displayBlock(block);
      } else {
        console.error(`Block #${specificBlock} not found.`);
      }
    } else {
      // Show last N blocks
      const startBlock = Math.max(0, latestBlockNumber - blocksToShow + 1);
      console.log(`Displaying blocks #${startBlock} to #${latestBlockNumber}`);

      // Get blocks in reverse order (newest first)
      for (let i = latestBlockNumber; i >= startBlock; i--) {
        const block = await getBlockDetails(provider, i);
        if (block) {
          displayBlock(block);
        }
      }
    }

  } catch (error) {
    console.error('Error:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('connecting to node') ||
          error.message.includes('Connection timeout')) {
        console.error('\nIt seems the RPC node is not available. Verify that:');
        console.error('1. The private Ethereum network is running (docker-compose up -d)');
        console.error('2. The RPC node is accessible at', RPC_URL);
        console.error('\nYou can check the container status with: docker-compose ps');
        console.error('And check the logs with: docker-compose logs -f eth-rpc');
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main().catch(console.error); 