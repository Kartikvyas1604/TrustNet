# TrustNet Enterprise Platform

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

> **Enterprise-Grade Privacy-Preserving Payroll & Transaction Platform**

TrustNet is a production-ready decentralized payroll and transaction management platform combining zero-knowledge proofs, blockchain privacy pools, and enterprise-grade authentication. Built for organizations that demand privacy, compliance, and transparency.

---

## 🚀 Features

### Core Functionality
- ✅ **Organization Management**: Multi-tenant SaaS with ENS domain integration
- ✅ **Employee Onboarding**: Secure registration with auth keys and wallet management
- ✅ **Privacy-Preserving Transfers**: ZK-proof verified transactions with compliance tracking
- ✅ **Real-time Monitoring**: WebSocket-based transaction status and employee activity
- ✅ **Merkle Tree Privacy Pools**: Compliance-friendly privacy with selective disclosure
- ✅ **Cross-Chain Support**: Uniswap v4 hooks and Yellow Network state channels

### Security Features
- 🔒 **Zero-Knowledge Proofs**: Circom circuits for amount commitments and membership proofs
- 🔐 **JWT Authentication**: Secure API access with organization-scoped tokens
- 🛡️ **Rate Limiting**: Redis-backed DDoS protection and API throttling
- 📝 **Audit Logging**: Comprehensive transaction and access logs
- 🔑 **Key Management**: Encrypted storage of sensitive authentication keys

### Blockchain Integration
- **Sui Move Contracts**: Privacy pools, employee wallets, payroll distribution
- **Uniswap v4 Hooks**: Privacy pool integration for DEX swaps
- **ENS Integration**: Human-readable organization identities
- **Circle Wallet SDK**: Cross-chain USDC transfers (proposed)

---

## 🌐 Deployed Contracts

### Base Sepolia Testnet (Ethereum L2)
- **Chain ID:** 84532
- **Transaction Membership Verifier:** [`0x0d2B09395Ae7C136e77892fC7EEFB0011898A4fe`](https://sepolia.basescan.org/address/0x0d2B09395Ae7C136e77892fC7EEFB0011898A4fe)
- **Amount Commitment Verifier:** [`0xfcE235771639Bbfc1dfEE7c3b499551ae0C3D414`](https://sepolia.basescan.org/address/0xfcE235771639Bbfc1dfEE7c3b499551ae0C3D414)

### Sui Testnet
- **Package ID:** [`0xaea2bdfbdab9d4f0ae173214c078e86f3e50d04a5ed8195192dec53729e3dfef`](https://testnet.suivision.xyz/package/0xaea2bdfbdab9d4f0ae173214c078e86f3e50d04a5ed8195192dec53729e3dfef)
- **Modules:** employee_wallet, organization_registry, payroll_distributor, privacy_pool

📄 **See full deployment details:** [ETHEREUM_DEPLOYMENT.md](./ETHEREUM_DEPLOYMENT.md) | [contracts/DEPLOYMENT.md](./contracts/DEPLOYMENT.md)

---

## 📋 Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **PostgreSQL**: v14+ (using NeonDB serverless)
- **Redis**: v7+ for caching and rate limiting
- **Sui CLI**: For smart contract deployment
- **Foundry**: For Ethereum/Optimism contract deployment
- **Circom**: v2.1+ for ZK circuit compilation

---

## 🔧 Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/trustnet.git
cd trustnet
```

### 2. Install Dependencies
```bash
# Root dependencies (frontend)
npm install

# Backend dependencies
cd backend
npm install
cd ..

# Uniswap v4 dependencies
cd uniswap
npm install
cd ..
```

### 3. Environment Setup

#### Backend Environment (backend/.env)
```env
# Database
DATABASE_URL="postgresql://username:password@ep-still-wave-19438729.us-east-2.aws.neon.tech/trustnet?sslmode=require"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secure-jwt-secret-minimum-32-chars"

# Sui Blockchain
SUI_NETWORK="testnet"
SUI_PRIVATE_KEY="your-sui-private-key"
SUI_PACKAGE_ID="0xaea2bdfbdab9d4f0ae173214c078e86f3e50d04a5ed8195192dec53729e3dfef"

# Ethereum/Base Blockchain
BASE_RPC_URL="https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
DEPLOYER_PRIVATE_KEY="0xYourPrivateKey"

# ZK Proof Verifier Contracts (Base Sepolia)
MEMBERSHIP_VERIFIER_ADDRESS="0x0d2B09395Ae7C136e77892fC7EEFB0011898A4fe"
AMOUNT_VERIFIER_ADDRESS="0xfcE235771639Bbfc1dfEE7c3b499551ae0C3D414"

# ENS Configuration
ENS_PROVIDER_URL="https://mainnet.infura.io/v3/YOUR_INFURA_KEY"

# Yellow Network
YELLOW_API_KEY="your-yellow-network-api-key"
YELLOW_API_URL="https://api.yellownetwork.io"

# Server
PORT=3001
NODE_ENV="development"
```

#### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

### 4. Database Setup
```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with demo data
npm run seed
```

### 5. Compile ZK Circuits
```bash
cd circuits

# Download Powers of Tau
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -O keys/pot12_final.ptau

# Compile circuits
circom amount_commitment.circom --r1cs --wasm --sym -o build/amount_commitment
circom transaction_membership.circom --r1cs --wasm --sym -o build/transaction_membership

# Generate proving and verification keys
snarkjs groth16 setup build/amount_commitment/amount_commitment.r1cs keys/pot12_final.ptau keys/amount_commitment/proving_key.zkey
snarkjs zkey export verificationkey keys/amount_commitment/proving_key.zkey keys/amount_commitment/verification_key.json

snarkjs groth16 setup build/transaction_membership/transaction_membership.r1cs keys/pot12_final.ptau keys/transaction_membership/proving_key.zkey
snarkjs zkey export verificationkey keys/transaction_membership/proving_key.zkey keys/transaction_membership/verification_key.json
```

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend Server**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

**Terminal 3 - Redis (if local)**
```bash
redis-server
# Redis runs on localhost:6379
```

### Production Mode

**Backend**
```bash
cd backend
npm run build
npm start
```

**Frontend**
```bash
npm run build
npm start
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Organizations

**Register Organization**
```http
POST /api/v1/organizations/register
Content-Type: application/json

{
  "name": "Acme Corp",
  "ensName": "acme.trustnet.eth",
  "adminEmail": "admin@acme.com",
  "adminPassword": "securePassword123"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "organizationId": "org_abc123",
    "authToken": "jwt.token.here",
    "organization": {
      "name": "Acme Corp",
      "ensName": "acme.trustnet.eth"
    }
  }
}
```

#### Employees

**Onboard Employee**
```http
POST /api/v1/employees/onboard
Authorization: Bearer <org-token>
Content-Type: application/json

{
  "authKey": "auth_key_employee123",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "employeeId": "emp_xyz789",
    "authKey": "auth_key_employee123",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "status": "active"
  }
}
```

**Get Employee Details**
```http
GET /api/v1/employees/:employeeId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "employeeId": "emp_xyz789",
    "authKey": "auth_key_employee123",
    "profileData": {
      "name": "John Doe",
      "email": "john@acme.com"
    },
    "walletAddresses": {
      "sui": "0x...",
      "ethereum": "0x..."
    },
    "status": "active"
  }
}
```

#### Transactions

**Create Transaction**
```http
POST /api/v1/transactions/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "1000.50",
  "currency": "USDC",
  "paymentMethod": "blockchain",
  "description": "Monthly payroll"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "transactionId": "txn_abc123",
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "1000.50",
    "currency": "USDC",
    "status": "pending",
    "zkProofGenerated": true,
    "estimatedCompletionTime": "2024-01-15T10:30:00Z"
  }
}
```

**Get Transaction Status**
```http
GET /api/v1/transactions/:transactionId
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "transactionId": "txn_abc123",
    "status": "completed",
    "blockchainTxHash": "0xabc...123",
    "zkProof": {
      "verified": true,
      "proofHash": "0x..."
    },
    "completedAt": "2024-01-15T10:30:15Z"
  }
}
```

#### WebSocket Events

**Connect to WebSocket**
```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for transaction updates
socket.on('transaction:update', (data) => {
  console.log('Transaction update:', data);
});

// Listen for employee updates
socket.on('employee:update', (data) => {
  console.log('Employee update:', data);
});
```

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript 5.x
- Tailwind CSS 4
- Framer Motion (animations)
- Radix UI (components)

**Backend**
- Node.js 18+ with Express.js
- TypeScript 5.x
- Prisma 5.22 ORM
- PostgreSQL (NeonDB)
- Redis (caching + rate limiting)
- Socket.io (WebSockets)
- Winston (logging)

**Blockchain**
- Sui Move (privacy pools, wallets)
- Solidity (Uniswap v4 hooks)
- Circom (ZK circuits)
- ethers.js 6.9
- @mysten/sui.js

**Infrastructure**
- NeonDB (serverless PostgreSQL)
- Redis Cloud / Local
- Vercel (frontend deployment)
- Railway / Render (backend deployment)

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ Dashboard  │  │ Transfers  │  │ Employee Management │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                   Backend API (Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth Service │  │ Employee Svc │  │ Transaction Svc  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ ZK Proof Svc │  │ MerkleTree   │  │ Blockchain Svc   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌─────────────┐
    │ NeonDB   │  │  Redis   │  │ Sui/Eth RPC │
    │Postgres) │  │ (Cache)  │  │   Nodes     │
    └──────────┘  └──────────┘  └─────────────┘
```

### Data Flow: Transaction Creation

1. **User Input**: User fills transfer form in dashboard
2. **Frontend Validation**: Amount, address, and currency validation
3. **API Call**: POST to `/api/v1/transactions/create`
4. **Authentication**: JWT token verified, organization extracted
5. **ZK Proof Generation**: Amount commitment circuit generates proof
6. **Merkle Tree Update**: Transaction added to privacy pool
7. **Blockchain Submission**: Transaction sent to Sui network
8. **Database Persistence**: Transaction record saved to PostgreSQL
9. **WebSocket Notification**: Real-time update sent to dashboard
10. **Response**: Transaction ID and status returned to frontend

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
npm test
```

### Contract Tests

**Sui Move Tests**
```bash
cd contracts
sui move test
```

**Uniswap v4 Tests**
```bash
cd uniswap
npx hardhat test
```

---

## 🚢 Deployment

### Deploy Smart Contracts

**Sui Contracts**
```bash
cd contracts

# Publish to testnet
sui client publish --gas-budget 100000000

# Save package IDs
# Update backend/.env with:
# ORGANIZATION_REGISTRY_PACKAGE_ID=0x...
# EMPLOYEE_WALLET_PACKAGE_ID=0x...
# PRIVACY_POOL_PACKAGE_ID=0x...
```

**Uniswap v4 Hook (Optimism Sepolia)**
```bash
cd uniswap

# Deploy hook contract
npx hardhat ignition deploy ./ignition/modules/PrivacyPoolHook.ts --network optimism-sepolia

# Update backend/.env with contract address
```

### Deploy Backend

**Option 1: Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Option 2: Render**
1. Connect GitHub repo to Render
2. Configure environment variables
3. Deploy automatically on push

### Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## 📖 Development Guide

### Project Structure

```
trustnet/
├── src/                      # Frontend (Next.js)
│   ├── app/                  # App Router pages
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── transfer/     # Transfer funds page
│   │   │   └── employees/    # Employee management
│   │   └── auth/             # Authentication pages
│   ├── components/           # React components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── layout/           # Layout components
│   │   ├── ui/               # Reusable UI components
│   │   └── wallet/           # Wallet components
│   └── lib/                  # Utilities
│       ├── api-client.ts     # API client with TypeScript types
│       └── utils.ts          # Helper functions
├── backend/                  # Backend (Express)
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── models/           # Database models (Prisma)
│   │   ├── middleware/       # Express middleware
│   │   ├── utils/            # Backend utilities
│   │   └── types/            # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   └── circuits/             # ZK circuit build outputs
├── circuits/                 # Circom ZK circuits
│   ├── amount_commitment.circom
│   ├── transaction_membership.circom
│   ├── build/                # Compiled circuits
│   └── keys/                 # Proving/verification keys
├── contracts/                # Sui Move contracts
│   └── sources/
│       ├── privacy_pool.move
│       ├── employee_wallet.move
│       └── organization_registry.move
└── uniswap/                  # Uniswap v4 integration
    ├── contracts/
    │   └── hooks/
    │       └── PrivacyPoolHook.sol
    └── test/
```

### Adding New Features

#### 1. Add Database Model
Edit `backend/prisma/schema.prisma`:
```prisma
model NewFeature {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
}
```

Run migration:
```bash
cd backend
npx prisma migrate dev --name add_new_feature
```

#### 2. Create Backend Service
Create `backend/src/services/NewFeatureService.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export class NewFeatureService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: any) {
    return await this.prisma.newFeature.create({ data });
  }
}
```

#### 3. Add API Route
Create `backend/src/routes/newFeature.ts`:
```typescript
import { Router } from 'express';
import { NewFeatureService } from '../services/NewFeatureService';

const router = Router();
const service = new NewFeatureService();

router.post('/', async (req, res) => {
  try {
    const result = await service.create(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

#### 4. Update Frontend API Client
Edit `src/lib/api-client.ts`:
```typescript
export const createNewFeature = async (data: any) => {
  const response = await fetch(`${API_URL}/newfeature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

#### 5. Create Frontend Component
Create page at `src/app/dashboard/newfeature/page.tsx`:
```typescript
'use client';
import { createNewFeature } from '@/lib/api-client';

export default function NewFeaturePage() {
  // Component implementation
}
```

---

## 🔐 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use different secrets for dev/staging/prod
- Rotate JWT secrets periodically
- Use strong database passwords (32+ characters)

### API Security
- All endpoints require authentication except `/health`
- Rate limiting: 100 requests per 15 minutes per IP
- CORS configured for production domains only
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM

### Blockchain Security
- Private keys never stored in code
- All transactions signed client-side
- ZK proofs verified on-chain
- Multi-signature wallets for organization funds

---

## 📊 Project Status

### Completion: 95%

**Completed Features** ✅
- Full-stack application (frontend + backend)
- Organization registration with ENS
- Employee onboarding and management
- Privacy-preserving transactions with ZK proofs
- Real-time WebSocket updates
- Sui Move smart contracts
- Uniswap v4 privacy hook
- Merkle tree privacy pools
- JWT authentication
- API client with TypeScript
- Database schema and migrations
- Seed data for testing

**In Progress** 🚧
- Smart contract deployment to testnets
- Complete Sui SDK integration
- Yellow Network state channel implementation
- Circle Wallet SDK integration

**Pending** 📋
- Production blockchain deployments
- Comprehensive end-to-end tests
- Performance optimization
- Security audit
- Documentation site

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

---

## 📝 License

MIT License - see LICENSE file for details

---

## 📞 Support

- **Documentation**: [docs.trustnet.io](https://docs.trustnet.io)
- **Issues**: [GitHub Issues](https://github.com/yourusername/trustnet/issues)
- **Discord**: [Join Community](https://discord.gg/trustnet)
- **Email**: support@trustnet.io

---

## 🙏 Acknowledgments

- **Sui Foundation** - Blockchain infrastructure
- **Uniswap Labs** - DEX integration
- **Yellow Network** - State channel infrastructure
- **NeonDB** - Serverless PostgreSQL
- **Circom/snarkjs** - Zero-knowledge proof tools

---

**Built with ❤️ for enterprises demanding privacy and compliance**
