#!/usr/bin/env tsx
/**
 * Liquidation Bot for RoomLen Protocol
 *
 * Este bot monitorea préstamos vencidos y los liquida automáticamente
 * Cualquiera puede correr este bot y ayudar a mantener el protocolo saludable
 *
 * Uso:
 *   npm install
 *   npx tsx scripts/liquidationBot.ts
 */

import { ethers } from 'ethers';
import { lendingProtocolAddress, RPC_URL } from '../src/lib/contractAddresses';

// ABI simplificado - solo las funciones que necesitamos
const LENDING_PROTOCOL_ABI = [
  'function getLoansCount() external view returns (uint256)',
  'function getLoan(uint256 _loanId) external view returns (tuple(uint256 nftId, address borrower, address lender, uint96 amount, uint64 fundingDate, uint64 dueDate, uint16 termInMonths, uint8 status))',
  'function liquidateLoan(uint256 _loanId) external',
];

// Status enum: Requested=0, Funded=1, Repaid=2, Defaulted=3
const LoanStatus = {
  Requested: 0,
  Funded: 1,
  Repaid: 2,
  Defaulted: 3,
};

interface Loan {
  nftId: bigint;
  borrower: string;
  lender: string;
  amount: bigint;
  fundingDate: bigint;
  dueDate: bigint;
  termInMonths: number;
  status: number;
}

class LiquidationBot {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private isRunning: boolean = false;

  constructor(privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      lendingProtocolAddress,
      LENDING_PROTOCOL_ABI,
      this.wallet
    );
  }

  async start(intervalMinutes: number = 60) {
    console.log('🤖 RoomLen Liquidation Bot Started');
    console.log(`📍 Protocol: ${lendingProtocolAddress}`);
    console.log(`👛 Bot Wallet: ${this.wallet.address}`);
    console.log(`⏰ Check interval: ${intervalMinutes} minutes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    this.isRunning = true;

    // Check immediately on start
    await this.checkAndLiquidate();

    // Then check periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(async () => {
      if (this.isRunning) {
        await this.checkAndLiquidate();
      }
    }, intervalMs);
  }

  async checkAndLiquidate() {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      console.log(`\n🔍 Checking for liquidatable loans... (${new Date().toISOString()})`);

      const totalLoans = await this.contract.getLoansCount();
      console.log(`📊 Total loans in protocol: ${totalLoans.toString()}`);

      let liquidatableCount = 0;
      let liquidatedCount = 0;

      for (let i = 0; i < Number(totalLoans); i++) {
        try {
          const loan: Loan = await this.contract.getLoan(i);

          // Check if loan is active (Funded) and overdue
          if (
            loan.status === LoanStatus.Funded &&
            currentTime > Number(loan.dueDate)
          ) {
            liquidatableCount++;
            const daysOverdue = Math.floor((currentTime - Number(loan.dueDate)) / 86400);

            console.log(`\n💀 Loan #${i} is overdue!`);
            console.log(`   Borrower: ${loan.borrower}`);
            console.log(`   Amount: ${ethers.formatEther(loan.amount)} wMXNB`);
            console.log(`   Days overdue: ${daysOverdue}`);
            console.log(`   Attempting liquidation...`);

            // Execute liquidation
            const tx = await this.contract.liquidateLoan(i);
            console.log(`   📝 Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log(`   ✅ Liquidation successful! Gas used: ${receipt.gasUsed.toString()}`);

            liquidatedCount++;

            // Add delay to avoid rate limiting
            await this.sleep(2000);
          }
        } catch (error: any) {
          // Si falla es probable que otro bot ya liquidó
          if (error.message.includes('El prestamo no esta activo')) {
            console.log(`   ℹ️  Loan #${i} already liquidated by someone else`);
          } else {
            console.error(`   ❌ Error liquidating loan #${i}:`, error.message);
          }
        }
      }

      if (liquidatableCount === 0) {
        console.log('✨ No loans to liquidate. All loans are healthy!');
      } else {
        console.log(`\n📈 Summary: ${liquidatedCount}/${liquidatableCount} loans liquidated`);
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      console.error('❌ Error in checkAndLiquidate:', error);
    }
  }

  stop() {
    this.isRunning = false;
    console.log('\n🛑 Bot stopped');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== MAIN ====================

async function main() {
  // Check if private key is provided
  const privateKey = process.env.PRIVATE_KEY || process.env.BOT_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY or BOT_PRIVATE_KEY environment variable not set');
    console.error('   Please set it in your .env file or export it:');
    console.error('   export PRIVATE_KEY="your-private-key-here"');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  let intervalMinutes = 60; // Default: check every hour

  if (args.length > 0) {
    const parsedInterval = parseInt(args[0]);
    if (!isNaN(parsedInterval) && parsedInterval > 0) {
      intervalMinutes = parsedInterval;
    } else {
      console.error('❌ Invalid interval. Usage: npx tsx scripts/liquidationBot.ts [intervalMinutes]');
      process.exit(1);
    }
  }

  const bot = new LiquidationBot(privateKey);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    bot.stop();
    process.exit(0);
  });

  await bot.start(intervalMinutes);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
