# 🚀 TrustNet - Complete Workflow Implementation

## 📋 Overview

TrustNet is a privacy-first payroll platform using parent-child wallet architecture. Organizations control parent wallets while employees have child wallets for free internal transactions.

## 🏗️ Architecture

### User Types
1. **Organizations** - Companies/Employers (Parent Wallets)
2. **Employees** - Workers (Child Wallets)

### Technology Stack
- **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **Database**: Neon DB (PostgreSQL) with Prisma ORM
- **Blockchain**: Sui (child wallets), Ethereum (ENS), Base, Polygon, Arbitrum, ARC
- **Off-Chain**: Yellow Network for instant free internal transactions
- **Privacy**: Zero-knowledge proofs (Circom + SnarkJS)
- **Payment**: Stripe for subscriptions

## 🔄 Complete Workflow

### 🏢 ORGANIZATION REGISTRATION FLOW

#### Step 1: Organization Type Selection
**Route**: `/organization/register`
- **Options**: Startup, Small Business, Mid-Market, Enterprise
- **Determines**: Employee limits, pricing tier

#### Step 2: Basic Information
**Route**: `/organization/register/details`
- Organization details (name, legal name, registration number)
- Business address
- Admin contact information
- **API**: `POST /api/organization/register/details`

#### Step 3: Employee License Selection
**Route**: `/organization/register/license`
- Select number of employees (1-10000)
- Choose billing cycle (monthly/annual)
- **Pricing**:
  - Starter: $2/employee/month (1-50 employees)
  - Business: $1.50/employee/month (51-200 employees)
  - Enterprise: $1/employee/month (200+ employees)
  - Annual: 15% discount
- **API**: `POST /api/organization/register/license`

#### Step 4: Payment
**Route**: `/organization/register/payment`
- Payment methods: Card (Stripe), Crypto (USDC), Bank Transfer, Invoice
- **API**: `POST /api/organization/register/payment`

#### Step 5: Document Upload (KYC)
**Route**: `/organization/register/verification`
- **Required Documents**:
  - Business Registration Certificate
  - Proof of Address
  - Admin ID Verification
  - Tax Document (optional)
- Files stored on IPFS or encrypted S3
- **API**: `POST /api/organization/register/verification`

#### Step 6: Wallet Connection
**Route**: `/organization/register/wallet`
- Connect admin wallet (MetaMask/WalletConnect)
- Sign message to prove ownership
- **API**: `POST /api/organization/register/wallet`

#### Step 7: Pending Verification
**Route**: `/organization/pending-verification`
- Status: Waiting for admin approval (24-48 hours)
- Cannot access dashboard until approved

#### Step 8: Admin Approval (Internal)
**Admin Panel**: `/admin/organizations/pending`
- Admin reviews KYC documents
- Performs compliance checks
- **On Approval**:
  - Deploys Sui OrganizationRegistry contract
  - Registers ENS domain (organizationname.eth)
  - Generates auth keys (equal to employee limit)
  - Creates treasury wallets (multi-chain)
  - Sends welcome email with auth keys CSV
- **API**: `POST /api/admin/organizations/:id/approve`

#### Step 9: Organization Dashboard
**Route**: `/organization/dashboard`
- **Features**:
  - Overview (employee count, treasury balance, transactions)
  - Auth key management (download, view status)
  - Treasury management (deposit, withdraw, balance)
  - Employee directory
  - Payroll center
  - External transaction approvals
  - Analytics & reports
  - Settings

---

### 👤 EMPLOYEE ONBOARDING FLOW

#### Step 1: Receive Auth Code
- Employee receives auth code from organization admin
- Format: `XXXX-XXXX-XXXX-XXXX`

#### Step 2: Visit TrustNet
**Route**: `/` → Click "I'm an Employee"

#### Step 3: Auth Code Entry
**Route**: `/employee/login`
- Enter 16-character auth code  
- **Validation**:
  - Format check (XXXX-XXXX-XXXX-XXXX)
  - Database lookup (hashed comparison)
  - Organization status check
  - Subscription status check
- **API**: `POST /api/employee/verify-code`

#### Step 4: Wallet Connection
**Route**: `/employee/onboard/wallet`
- Connect wallet (MetaMask/WalletConnect)
- Sign message to prove ownership
- **Checks**:
  - Wallet not already registered
  - Signature verification
- **API**: `POST /api/employee/connect-wallet`
- **API**: `POST /api/employee/verify-signature`

#### Step 5: Profile Creation
**Route**: `/employee/onboard/profile`
- **Fields**: Nickname, Email (optional), Avatar, Job Title
- **API**: `POST /api/employee/complete-onboarding`

#### Step 6: Blockchain Operations (Automated)
**Processing Screen**: `/employee/onboard/processing`
- **Operations** (2-5 seconds):
  1. Create ENS subdomain (nickname.organizationname.eth)
  2. Deploy Sui EmployeeWallet (child wallet)
  3. Open Yellow Network state channel
  4. Add to organization Merkle tree
  5. Mark auth key as "used"
- All atomic - succeed or fail together

#### Step 7: Employee Dashboard
**Route**: `/employee/dashboard` or `/dashboard/overview`
- **Features**:
  - Balance display (on-chain, off-chain, total)
  - Send payment (internal/external)
  - Receive (QR code with ENS)
  - Transaction history
  - Organization directory
  - Settings

---

### 💸 TRANSACTION FLOWS

#### Internal Transaction (Child-to-Child)
**When**: Both sender and recipient in same organization
**Flow**:
1. Employee enters recipient ENS or wallet address
2. System detects recipient is in same org
3. Route via Yellow Network (off-chain)
4. **Speed**: <100ms
5. **Cost**: $0 (free)
6. **Privacy**: Organization-only
7. Real-time WebSocket notifications
- **API**: `POST /api/transactions/send`

#### External Transaction (Requires Approval)
**When**: Recipient is outside organization
**Flow**:
1. Employee enters external wallet address
2. System detects external recipient
3. Create approval request
4. Lock employee funds
5. Notify organization admins
6. **Admin reviews**:
   - View employee history
   - Check recipient address (sanctions)
   - **Approve**: Execute on-chain with parent co-signature
   - **Reject**: Unlock funds, notify employee
7. If approved: Sui transaction with parent signature
8. Notify employee of result
- **APIs**:
  - `POST /api/transactions/send` (create request)
  - `POST /api/transactions/external/approve`
  - `POST /api/transactions/external/reject`
  - `GET /api/transactions/pending-approvals/:organizationId`

---

### 🏦 TREASURY & PAYROLL

#### Treasury Funding
**Route**: `/organization/treasury`
1. Admin selects chain (Ethereum, Sui, Base, etc.)
2. System displays deposit address + QR code
3. Admin sends USDC to address
4. Backend blockchain indexer detects deposit
5. Updates treasury balance
6. Real-time WebSocket notification
- **APIs**:
  - `GET /api/treasury/:organizationId`
  - `POST /api/treasury/:organizationId/deposit`
  - `POST /api/treasury/:organizationId/deposit-detected` (webhook)

#### Payroll Distribution
**Route**: `/organization/payroll`
1. Admin selects employees + amounts
2. System calculates total cost
3. Check treasury balance
4. Admin confirms
5. Execute Sui PTB (Programmable Transaction Block)
   - All payments in single atomic transaction
   - **Speed**: 2-3 seconds for 100 employees
   - **Cost**: ~$0.10 gas total
6. Update employee balances
7. Notify all employees via WebSocket
8. Create transaction records
- **APIs**:
  - `POST /api/payroll/run`
  - `GET /api/payroll/history/:organizationId`
  - `GET /api/payroll/employees/:organizationId`

---

## 🔒 Security & Compliance

### Parent-Child Wallet Permissions

**Parent (Organization) CAN**:
- ✅ View all child wallet balances
- ✅ View all transaction history
- ✅ Approve/reject external transactions
- ✅ Revoke employee access
- ✅ Fund child wallets (payroll)

**Parent (Organization) CANNOT**:
- ❌ Spend from child wallets without employee signature
- ❌ Transfer child wallet ownership
- ❌ See private memos between employees

**Child (Employee) CAN**:
- ✅ Send freely to other children (instant, free)
- ✅ Request external sends (needs parent approval)
- ✅ Receive from anyone
- ✅ View own balance and history

**Child (Employee) CANNOT**:
- ❌ Send to external addresses without parent approval
- ❌ Change parent organization
- ❌ Access organization treasury

### Audit Trail
- Every action logged in `AuditLog` table
- Encrypted details for sensitive data
- IP address and user agent tracking
- Compliance reports exportable

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL (Neon DB)
- Redis
- Sui CLI

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/trustnet.git
cd trustnet

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Neon DB URL and API keys

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:push

# Start backend server
npm run dev

# In another terminal, start frontend
cd ..
npm run dev
```

### Environment Variables

**Backend (.env)**:
```env
DATABASE_URL=postgresql://user:password@hostname/database?sslmode=require
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_xxxxx
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/api-key
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
REDIS_URL=redis://localhost:6379
```

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test

# End-to-end tests
npm run test:e2e
```

---

## 📦 Database Schema

### Key Models
- **Organization**: Companies with KYC, payment, subscription info
- **Employee**: Workers with wallets, profiles, channels
- **AuthKey**: One-time use codes for employee onboarding
- **Transaction**: All payment records (internal/external/payroll)
- **ExternalTransactionApproval**: External transaction approval workflow
- **PayrollRun**: Batch payroll distribution records
- **AuditLog**: Compliance and security audit trail
- **MerkleTree**: Organization membership proof

See `backend/prisma/schema.prisma` for full schema.

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Vercel/AWS/DigitalOcean)
```bash
cd backend
npm run build
npm start
```

### Database (Neon)
- Use Neon DB hosted PostgreSQL
- Connection pooling enabled
- Automated backups

---

## 📊 API Endpoints

### Organization
- `POST /api/organization/register/type` - Select organization type
- `POST /api/organization/register/details` - Submit org details
- `POST /api/organization/register/license` - Select employee licenses
- `POST /api/organization/register/payment` - Initiate payment
- `POST /api/organization/register/verification` - Upload KYC documents
- `POST /api/organization/register/wallet` - Connect admin wallet
- `GET /api/organization/status/:id` - Check registration status
- `POST /api/admin/organizations/:id/approve` - Approve organization (admin)

### Employee
- `POST /api/employee/verify-code` - Validate auth code
- `POST /api/employee/connect-wallet` - Connect employee wallet
- `POST /api/employee/verify-signature` - Verify wallet signature
- `POST /api/employee/complete-onboarding` - Complete onboarding
- `GET /api/employee/profile/:id` - Get employee profile
- `GET /api/employee/organization/:orgId/directory` - Employee directory

### Transactions
- `POST /api/transactions/send` - Send payment (internal or external)
- `POST /api/transactions/external/approve` - Approve external transaction
- `POST /api/transactions/external/reject` - Reject external transaction
- `GET /api/transactions/pending-approvals/:orgId` - Get pending approvals
- `GET /api/transactions/history/:employeeId` - Transaction history

### Treasury & Payroll
- `GET /api/treasury/:orgId` - Get treasury balance
- `POST /api/treasury/:orgId/deposit` - Get deposit address
- `POST /api/treasury/:orgId/deposit-detected` - Deposit webhook
- `POST /api/payroll/run` - Execute payroll
- `GET /api/payroll/history/:orgId` - Payroll history
- `GET /api/payroll/employees/:orgId` - Payroll employee list

---

## 🎯 Bounties & Integrations

### Sui Integration
- Child wallet deployment via Sui Move contracts
- Programmable Transaction Blocks (PTB) for batch payroll
- USDC transfers on Sui

### ENS Integration
- Subdomain creation (employee.org.eth)
- Resolver configuration for multi-chain addresses

### Yellow Network Integration
- Off-chain state channels for free internal transactions
- Sub-100ms transaction finality
- Zero gas fees

### Stripe Integration
- Subscription payments for organizations
- Webhook handling for payment confirmation
- Customer portal for subscription management

### Zero-Knowledge Proofs
- Circom circuits for amount commitments
- Transaction membership proofs
- Privacy-preserving compliance

---

## 📝 License & Contributing

MIT License - see LICENSE file

Contributions welcome! Please open an issue or PR.

---

## 🔗 Links

- Website: https://trustnet.vercel.app
- Documentation: https://docs.trustnet.com
- GitHub: https://github.com/your-org/trustnet
- Support: support@trustnet.com

---

**Built with ❤️ for enterprise privacy and compliance**
