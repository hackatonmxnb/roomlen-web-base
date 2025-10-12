# 🏠 RoomLen - Rent-backed Advances Platform

> **LATIN HACK 2025 Submission** | Built with ❤️ from Mexico 🇲🇽 and Bolivia 🇧🇴

**Get instant liquidity from rental agreements. Turn signed leases into upfront capital.**

[![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passing-success)](Foundry/test/)
[![Deploy](https://img.shields.io/badge/Deploy-Live%20on%20Paseo-success)](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 💡 What is RoomLen?

RoomLen is a **DeFi protocol** that unlocks liquidity from rental agreements by tokenizing leases as NFTs and enabling property owners to get upfront capital in exchange for future rent streams.

### The Problem
In Latin America, **$50B+ USD** is locked in signed rental agreements. Traditional lending is:
- ⏰ **Slow:** 2-4 weeks approval
- 💸 **Expensive:** 30-50% APR
- 📄 **Complex:** Excessive paperwork

### Our Solution
RoomLen provides instant liquidity at fair rates (15-28% APR) with just a signed lease.

---

## ✨ Key Features

- 🎫 **Tokenized Leases** - Rental agreements as ERC-721 NFTs
- ⚡ **Instant Advances** - Get 80-90% of future rent upfront
- 📊 **Risk-based Pricing** - 3 tiers: A (15% APR), B (20% APR), C (28% APR)
- 🔒 **Secure Escrow** - Smart contract-managed distribution
- 💰 **Tradeable Receipts** - Lender positions as ERC-721 NFTs
- 📈 **Real-time Dashboard** - Track portfolio and yields

---

## 🔗 Live Deployment (Paseo Testnet)

### Network Information
- **Chain ID:** 420420422
- **Network:** Paseo Testnet (Polkadot Asset Hub)
- **RPC:** https://testnet-passet-hub-eth-rpc.polkadot.io
- **Explorer:** https://blockscout-passet-hub.parity-testnet.parity.io
- **Faucet:** https://faucet.polkadot.io/?parachain=1111

### Contract Addresses

| Contract | Address | Explorer |
|----------|---------|----------|
| **LendingProtocol** | `0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4` | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x6Bd6fD3114dc7BB3b5bD137A51F474e78D065bA4) |
| **RentalNFT** | `0x9a340Cd35537C05ec78b41064D99d15fb08e2b97` | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x9a340Cd35537C05ec78b41064D99d15fb08e2b97) |
| **ReceiptNFT** | `0xC542E39374e63836B2307034E29cceE435A65545` | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xC542E39374e63836B2307034E29cceE435A65545) |
| **wMXNB Token** | `0xF48A62Fd563b3aBfDBA8542a484bb87183ef6342` | [View ↗](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xF48A62Fd563b3aBfDBA8542a484bb87183ef6342) |

---

## 🚀 Quick Start

### Try the Live App

```bash
git clone https://github.com/hackatonmxnb/roomlen-web.git
cd roomlen-web
npm install
npm run dev
```

Visit `http://localhost:3000` and connect your MetaMask wallet to Paseo Testnet.

### Get Test Tokens

1. Add Paseo network to MetaMask (the app will guide you)
2. Get free PAS tokens from [Polkadot Faucet](https://faucet.polkadot.io/?parachain=1111)
3. Start using RoomLen!

---

## 🏗️ How It Works

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Property   │  ────>  │   Tokenize   │  ────>  │ Request Loan │
│     Owner    │         │    Lease     │         │   (NFT as    │
│              │         │   (NFT)      │         │  collateral) │
└──────────────┘         └──────────────┘         └──────────────┘
                                                           │
                                                           ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Receive    │  <────  │   Investor   │         │   Loan       │
│   Advance    │         │    Funds     │  <────  │  Appears in  │
│   (wMXNB)    │         │  (Receipt    │         │ Marketplace  │
│              │         │    NFT)      │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

### For Property Owners
1. **Tokenize** your rental agreement (mint NFT)
2. **Request** an advance (stake NFT as collateral)
3. **Get funded** by an investor (receive wMXNB tokens)
4. **Repay** over time to reclaim your NFT

### For Investors
1. **Browse** available loan requests in marketplace
2. **Fund** a loan (approve + transfer wMXNB)
3. **Earn** interest (15-28% APR based on risk tier)
4. **Get repaid** or liquidate collateral if defaulted

---

## 📊 Risk Tiers

| Tier | Credit Score | Haircut | LTV  | APR  |
|------|-------------|---------|------|------|
| 🟢 A | 80-100      | 10%     | 90%  | 15%  |
| 🟡 B | 60-79       | 15%     | 85%  | 20%  |
| 🔴 C | 40-59       | 22%     | 78%  | 28%  |

**Example (Tier A):**
- 12-month lease × $5,000/month = $60,000 total rent
- After 10% haircut: $54,000
- Max advance: $54,000 / 1.10 (OC) = **$49,090**
- Interest (15% APR): $7,364
- Total repayment: **$56,454**

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity 0.8.20** + **Foundry**
- **OpenZeppelin** libraries
- **ERC-721** for NFTs
- **Paseo Testnet** (Polkadot Asset Hub)

### Frontend
- **Next.js 14** + **TypeScript**
- **Tailwind CSS** + **ethers.js/viem**
- **React** hooks

---

## 🧪 Testing

### Run Smart Contract Tests
```bash
cd Foundry
forge test -vvv
```

**Result:** ✅ 9/9 tests passing

### Test the Live App
Navigate to the test interface at `/test` to interact directly with smart contracts:
- Mint rental agreement NFTs
- Request loans
- View on-chain state

---

## 📁 Project Structure

```
roomlen-web/
├── src/
│   ├── app/              # Next.js pages
│   │   ├── page.tsx      # Landing page
│   │   ├── owner/        # Owner dashboard
│   │   ├── investor/     # Investor dashboard
│   │   └── test/         # Contract test interface
│   ├── components/       # React components
│   ├── lib/
│   │   ├── abi/          # Contract ABIs
│   │   └── api/          # API integration
│   └── hooks/            # Custom hooks
├── Foundry/
│   ├── src/              # Solidity contracts
│   ├── script/           # Deployment scripts
│   └── test/             # Contract tests
└── public/               # Static assets
```

---

## 🔒 Security

- ✅ OpenZeppelin libraries
- ✅ ReentrancyGuard on all state-changing functions
- ✅ SafeERC20 for token transfers
- ✅ Ownable access control
- ✅ 9 comprehensive tests

⚠️ **Testnet MVP** - Not audited. Not for production use.

---

## 🗺️ Roadmap

### Phase 1: MVP ✅ (Current)
- Core smart contracts
- Tokenization of rental agreements
- P2P lending marketplace
- Owner & Investor dashboards

### Phase 2: Beta (Q1 2025)
- [ ] Mainnet deployment on Moonbeam
- [ ] KYC/AML integration
- [ ] Enhanced risk scoring
- [ ] Multi-currency support (USDC, DAI)

### Phase 3: Scale (Q2-Q3 2025)
- [ ] Pooled lending (ERC-4626)
- [ ] Secondary market for receipts
- [ ] Mobile app
- [ ] Expand to 3 LATAM countries

---

## 📄 License

MIT License - see LICENSE file

---

## 🔗 Links

- **Live App:** [Coming Soon]
- **Video Demo:** [Coming Soon]
- **Block Explorer:** [Paseo Blockscout](https://blockscout-passet-hub.parity-testnet.parity.io)
- **Faucet:** [Polkadot Faucet](https://faucet.polkadot.io/?parachain=1111)

---

**Built from 🇲🇽 🇧🇴 | "Live. Rent. Earn."**
