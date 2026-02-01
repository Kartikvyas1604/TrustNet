# TrustNet Backend

Enterprise Privacy Payroll Platform - Backend API

## 🚀 Features (10% MVP)

- **Organization Management**: Register organizations with KYC validation
- **Auth Key System**: Generate and validate secure employee auth keys
- **Employee Onboarding**: Connect wallets and join organizations
- **Transaction Processing**: Record and track USDC transactions
- **MongoDB Integration**: Persistent storage for all entities
- **RESTful API**: Express-based API endpoints

## 🏗️ Architecture

```
backend/
├── src/
│   ├── models/          # MongoDB schemas
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   ├── utils/           # Helper functions
│   └── index.ts         # Main server
├── package.json
└── tsconfig.json
```

## 🛠️ Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Organizations
- `POST /api/organizations/register` - Register new organization
- `GET /api/organizations/:id` - Get organization details
- `POST /api/organizations/:id/generate-keys` - Generate auth keys

### Employees
- `POST /api/employees/onboard` - Onboard employee with auth key
- `GET /api/employees/:id` - Get employee details
- `GET /api/employees/organization/:orgId` - List organization employees

### Transactions
- `POST /api/transactions/send` - Send transaction
- `GET /api/transactions/employee/:employeeId` - Get employee transactions
- `GET /api/transactions/organization/:orgId` - Get organization transactions

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing for auth keys
- Input validation and sanitization
- Rate limiting on sensitive endpoints

## 📊 Database Schema

- **Organizations**: Company details, KYC status, treasury info
- **Employees**: Wallet addresses, organization reference, profile
- **AuthKeys**: Secure keys for employee onboarding
- **Transactions**: Payment records with full audit trail

## 🎯 Roadmap

This is 10% of the full system. Future enhancements:
- Yellow Network state channel integration
- Uniswap v4 privacy pool hooks
- Sui blockchain settlement layer
- ENS subdomain provisioning
- ZK proof generation for private transactions
- Real-time WebSocket updates
- Cross-chain transaction routing
