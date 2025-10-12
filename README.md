# 🏠 RoomLen - Rent-backed Advances Platform

> **LATIN HACK 2025 Submission** | Built from Mexico 🇲🇽 and Bolivia 🇧🇴

**Unlock liquidity from rental agreements. Convert signed leases into upfront capital today.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Polkadot](https://img.shields.io/badge/Network-Paseo%20Testnet-E6007A?logo=polkadot&logoColor=white)](https://polkadot.network/)
[![Foundry](https://img.shields.io/badge/Foundry-Tested-black?logo=ethereum&logoColor=white)](https://getfoundry.sh/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passing-success)](Foundry/test/)
[![Deploy](https://img.shields.io/badge/Deploy-Live%20on%20Paseo-success)](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4)

---

## 💡 What is RoomLen?

RoomLen is a **DeFi protocol** that unlocks liquidity from rental agreements by tokenizing leases as NFTs and enabling property owners to get upfront capital in exchange for future rent streams. Investors fund these advances and receive rent payments via secure on-chain escrow.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🎫 **Tokenized Leases** | Rental agreements represented as ERC-721 NFTs with on-chain verification |
| ⚡ **Instant Advances** | Get 80-90% of future rent upfront based on credit scoring |
| 📊 **Risk-based Pricing** | Algorithmic risk assessment with 3 tiers (A: 15% APR, B: 20% APR, C: 28% APR) |
| 🔒 **Secure Escrow** | Smart contract-managed distribution with ReentrancyGuard protection |
| 💰 **Composable Receipts** | Lender positions as tradeable ERC-721 NFTs |
| 📈 **Investor Dashboard** | Browse marketplace, manage portfolio, track yields in real-time |

### 🎯 The Problem We Solve

In Latin America, **$50B+ USD** is locked in signed rental agreements with property owners unable to access this capital. Traditional lending is:
- ⏰ **Slow:** 2-4 weeks approval
- 💸 **Expensive:** 30-50% APR
- 📄 **Complex:** Excessive paperwork and requirements

RoomLen provides instant liquidity at fair rates (15-28% APR) with just a signed lease.

---

---

## 🔗 Smart Contracts (Deployed on Paseo Testnet)

### 🌐 Network Information

- **Network:** Paseo Testnet (Polkadot Asset Hub)
- **Chain ID:** 420420422
- **Native Token:** PAS
- **RPC URL:** https://testnet-passet-hub-eth-rpc.polkadot.io
- **Block Explorer:** https://blockscout-passet-hub.parity-testnet.parity.io
- **Faucet:** https://faucet.polkadot.io/?parachain=1111

### 📜 Contract Addresses

| Contract | Address | Description | Explorer |
|----------|---------|-------------|----------|
| **🏦 LendingProtocol** | `0x6Bd6fD...5bA4` | Main protocol orchestrator | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4) |
| **🏠 RentalNFT** | `0x9a340C...2b97` | Rental agreement tokenization | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x9a340Cd35537C05ec78b41064D99d15fb08e2b97) |
| **🎫 ReceiptNFT** | `0xC542E3...A65545` | Lender position receipts | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xC542E39374e63836B2307034E29cceE435A65545) |
| **💵 wMXNB Token** | `0xF48A62...f6342` | Protocol currency (testnet) | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xF48A62Fd563b3aBfDBA8542a484bb87183ef6342) |

<details>
<summary>📋 Full Addresses</summary>

```
LendingProtocol:     0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4
RentalNFT:           0x9a340Cd35537C05ec78b41064D99d15fb08e2b97
ReceiptNFT:          0xC542E39374e63836B2307034E29cceE435A65545
wMXNB:               0xF48A62Fd563b3aBfDBA8542a484bb87183ef6342
Base64 Library:      0x98f3514459284767360E51fB117996ed25Dd956b
```
</details>

### Contract ABI

The Application Binary Interface (ABI) for the main `LendingProtocol` contract is available in:
- **File:** [`LendingProtocol_ABI.json`](./LendingProtocol_ABI.json)

---

## 🏗️ Architecture & How It Works

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Landing    │  │    Owner     │  │     Investor       │   │
│  │     Page     │  │   Dashboard  │  │     Dashboard      │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ ethers.js / viem
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACTS (Solidity)                    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              LendingProtocol (Main Logic)               │   │
│  │  • requestLoan()  • fundLoan()  • repayLoan()          │   │
│  │  • liquidateLoan()  • Risk Tier Management             │   │
│  └─────────┬─────────────────┬──────────────────┬─────────┘   │
│            │                 │                  │               │
│     ┌──────▼─────┐   ┌──────▼────────┐  ┌─────▼────────┐     │
│     │  RentalNFT │   │  ReceiptNFT   │  │   wMXNB      │     │
│     │  (ERC-721) │   │   (ERC-721)   │  │  (ERC-20)    │     │
│     │            │   │               │  │              │     │
│     │ • mint()   │   │ • mint()      │  │ • mint()     │     │
│     │ • burn()   │   │ • burn()      │  │ • transfer() │     │
│     └────────────┘   └───────────────┘  └──────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Paseo Testnet (Polkadot Asset Hub)                 │
│                     EVM-Compatible Layer                         │
└─────────────────────────────────────────────────────────────────┘
```

### User Flow Diagrams

<details>
<summary><b>🏠 Property Owner Flow (Borrower)</b></summary>

```
1. TOKENIZE LEASE
   Owner submits rental agreement
   → Smart contract mints Rental NFT
   → NFT contains: rent amount, term, credit score

2. REQUEST LOAN
   Owner stakes NFT as collateral
   → Protocol calculates max advance (based on risk tier)
   → Loan request appears in marketplace

3. GET FUNDED
   Investor funds the loan
   → wMXNB tokens transferred to owner
   → Lender receives Receipt NFT

4. REPAY LOAN
   Owner repays principal + interest
   → Collateral NFT returned to owner
   → Lender's Receipt NFT burned
```
</details>

<details>
<summary><b>💼 Investor Flow (Lender)</b></summary>

```
1. BROWSE MARKETPLACE
   View available loan requests
   → See: property details, risk tier, APR
   → Filter by: credit score, loan amount, term

2. FUND LOAN
   Select a loan to fund
   → Approve wMXNB spending
   → Execute fundLoan() transaction
   → Receive Receipt NFT (tradeable position)

3. EARN YIELD
   Borrower makes payments
   → Interest accrues over time
   → Track returns in dashboard

4. GET REPAID or LIQUIDATE
   OPTION A: Borrower repays
   → Receive principal + interest
   → Receipt NFT burned

   OPTION B: Borrower defaults
   → Receive collateral Rental NFT
   → Can sell NFT or hold property rights
```
</details>

### Risk Tier System

```
┌─────────────┬──────────────┬─────────────┬──────────────┬───────────┐
│  Tier       │ Credit Score │ Haircut     │ LTV Ratio    │ APR       │
├─────────────┼──────────────┼─────────────┼──────────────┼───────────┤
│ 🟢 Tier A   │  80-100      │  10%        │  90%         │  15%      │
│ 🟡 Tier B   │  60-79       │  15%        │  85%         │  20%      │
│ 🔴 Tier C   │  40-59       │  22%        │  78%         │  28%      │
└─────────────┴──────────────┴─────────────┴──────────────┴───────────┘

Example Calculation (Tier A):
Property: 12-month lease × $5,000/month = $60,000 total rent
Discount (NPV): $60,000 - 10% haircut = $54,000
Max Advance: $54,000 / (1 + 10% overcollateral) = $49,090
Interest: 15% APR over 12 months = $7,364
Total Repayment: $56,454
```

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity 0.8.20** - Smart contract development
- **Foundry** - Testing and deployment framework
- **OpenZeppelin** - Battle-tested contract libraries
- **ERC721** - NFT standard for rental agreements
- **Paseo** - Polkadot Asset Hub testnet (EVM-compatible)

### Frontend
- **Next.js 14** with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **ethers.js & viem** - Ethereum library
- **React** - UI framework

### Infrastructure
- **Paseo Testnet** - Polkadot Asset Hub testnet deployment
- **MetaMask** - Wallet integration
- **Blockscout** - Block explorer

---

## 🧪 How to Test the Project

### Option 1: Use the Live Test Interface (Recommended)

1. **Navigate to test page:**
   ```
   
   ```

2. **Connect your wallet:**
   - Make sure you're on Moonbase Alpha network
   - Get testnet DEV tokens from: https://faucet.moonbeam.network/

3. **Interact with contracts:**
   - Mint a test NFT
   - Request a loan
   - View on-chain state changes

### Option 2: Direct Smart Contract Interaction

**Using Foundry:**

```bash
cd Foundry

# Read total loans
cast call 0x9c2be1158ba6B8ED8B528B685058F743336b988F \
  "getLoansCount()" \
  --rpc-url https://rpc.api.moonbase.moonbeam.network

# Read risk tiers
cast call 0x9c2be1158ba6B8ED8B528B685058F743336b988F \
  "getRiskTiers()" \
  --rpc-url https://rpc.api.moonbase.moonbeam.network
```

**Using Moonscan:**

1. Go to [LendingProtocol on Moonscan](https://moonbase.moonscan.io/address/0x9c2be1158ba6B8ED8B528B685058F743336b988F#readContract)
2. Navigate to "Read Contract" tab
3. Query contract state directly

---

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Git
- MetaMask browser extension

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hackatonmxnb/roomlen-web.git
   cd roomlen-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Testing Smart Contracts

```bash
cd Foundry

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testRequestLoan
```

**Test Results:** ✅ 9/9 tests passing

---

## 📋 Project Structure

```
roomlen-web/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── owner/page.tsx     # Owner dashboard
│   │   ├── investor/page.tsx  # Investor dashboard
│   │   └── test/page.tsx      # Contract test interface
│   ├── components/            # Reusable React components
│   ├── lib/
│   │   ├── contractAddresses.ts  # Deployed contract addresses
│   │   ├── abi/                  # Contract ABIs
│   │   └── api/                  # API integration
│   └── hooks/                 # Custom React hooks
├── Foundry/
│   ├── src/                   # Solidity contracts
│   ├── script/                # Deployment scripts
│   ├── test/                  # Contract tests
│   └── foundry.toml           # Foundry configuration
└── public/                    # Static assets
```

---

## 🎬 Demo Video

> **Coming Soon:** 3-minute pitch and demo video

---

## Security & Testing

### Smart Contract Security

- ✅ **OpenZeppelin** libraries for battle-tested implementations
- ✅ **ReentrancyGuard** on all state-changing functions
- ✅ **SafeERC20** for token transfers
- ✅ **Ownable** access control
- ✅ **9 comprehensive tests** covering main flows

### Known Limitations (Testnet MVP)

⚠️ This is a hackathon prototype deployed on testnet. Not audited. Not for production use.

- KYC/AML integration is planned but not implemented
- Rent payment oracle is simulated
- No emergency pause mechanism yet
- Risk scoring is simplified

---

## Roadmap

### Phase 1: MVP (Current - Hackathon)
-  Core smart contracts
-  Tokenization of rental agreements
-  P2P lending marketplace
-  Owner & Investor dashboards
-  Test interface

### Phase 2: Beta (Q1 2025)
- [ ] Mainnet deployment on Moonbeam
- [ ] KYC/AML integration
- [ ] Enhanced risk scoring with oracles
- [ ] Multi-currency support (USDC, DAI)

### Phase 3: Scale (Q2-Q3 2025)
- [ ] Pooled lending (ERC-4626 vault)
- [ ] Secondary market for receipt NFTs
- [ ] Mobile app
- [ ] Expansion to 3 LATAM countries


## 📄 License

MIT License - see LICENSE file for details

---

## 🔗 Links

- **Live Demo:** [Coming Soon]
- **Video Pitch:** [Coming Soon]
- **Block Explorer:** [Moonbase Moonscan](https://moonbase.moonscan.io)
- **Network Faucet:** [Moonbeam Faucet](https://faucet.moonbeam.network/)

---

## ⚡ Quick Start for Judges

### 1. View Live Demo with Test Data (Recommended)

We have **pre-populated test data** on Paseo Testnet for easy testing:

**Test Wallet:** `0x648A0C0f284BB86dba990EcDdb3237275882dD6F`
- ✅ 20,000 wMXNB tokens available
- ✅ 3 Rental Agreement NFTs minted (different credit scores: 85, 65, 45)
- ✅ All contracts configured and ready

**To test:**

1. **Add Paseo Testnet to MetaMask:**
   ```
   Network Name: Paseo Testnet
   RPC URL: https://testnet-passet-hub-eth-rpc.polkadot.io
   Chain ID: 420420422
   Currency Symbol: PAS
   Block Explorer: https://blockscout-passet-hub.parity-testnet.parity.io
   ```

2. **Get PAS tokens from faucet:**
   - Visit: https://faucet.polkadot.io/?parachain=1111
   - Request tokens for gas fees

3. **View contracts on-chain:**
   - Main contract: https://blockscout-passet-hub.parity-testnet.parity.io/address/0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4
   - Rental NFTs: https://blockscout-passet-hub.parity-testnet.parity.io/address/0x9a340Cd35537C05ec78b41064D99d15fb08e2b97
   - wMXNB Token: https://blockscout-passet-hub.parity-testnet.parity.io/address/0xF48A62Fd563b3aBfDBA8542a484bb87183ef6342

4. **Run the frontend:**
   ```bash
   git clone https://github.com/hackatonmxnb/roomlen-web.git
   cd roomlen-web
   npm install
   npm run dev
   ```
   Open: http://localhost:3000

### 2. Create Your Own Test Data

If you want to test with your own wallet:

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your PRIVATE_KEY
   ```

2. **Run setup script:**
   ```bash
   npx tsx scripts/setupDemoData.ts
   ```

   This will:
   - Mint 20,000 wMXNB tokens to your wallet
   - Create 3 Rental Agreement NFTs with different risk profiles
   - Approve tokens for the protocol

### 3. Test the Complete Flow

**As Property Owner (Borrower):**
1. Navigate to `/owner` page
2. View your Rental Agreement NFTs
3. Request a loan using an NFT as collateral
4. See calculated loan amount based on credit score

**As Investor (Lender):**
1. Navigate to `/investor` page
2. Browse available loan requests
3. Fund a loan
4. Receive a Receipt NFT representing your investment

**View On-Chain:**
- All transactions are visible on: https://blockscout-passet-hub.parity-testnet.parity.io

### 4. Review Code

- **Smart contracts:** `Foundry/src/`
- **Frontend:** `src/app/`
- **Tests:** `Foundry/test/`
- **Setup script:** `scripts/setupDemoData.ts`

---

**Built from 🇲🇽 🇧🇴 | "Live. Rent. Earn."**
