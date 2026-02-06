-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAYMENT_RECEIVED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuthKeyStatus" AS ENUM ('UNUSED', 'ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('YELLOW_OFFCHAIN', 'UNISWAP_PRIVACY', 'SUI_DIRECT', 'CROSS_CHAIN', 'PAYROLL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('PUBLIC', 'ORGANIZATION_ONLY', 'FULLY_PRIVATE');

-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('OPENING', 'OPEN', 'SETTLING', 'CLOSED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_business_name" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "business_address" JSONB NOT NULL,
    "industry" TEXT,
    "website_url" TEXT,
    "admin_name" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "admin_phone" TEXT NOT NULL,
    "admin_job_title" TEXT NOT NULL,
    "kyc_status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "kyc_documents" JSONB,
    "verified_at" TIMESTAMP(3),
    "verification_notes" TEXT,
    "subscription_tier" "SubscriptionTier" NOT NULL DEFAULT 'STARTER',
    "employee_limit" INTEGER NOT NULL DEFAULT 10,
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "monthly_price" TEXT,
    "annual_price" TEXT,
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "next_billing_date" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "organization_type" TEXT,
    "admin_wallets" JSONB NOT NULL,
    "treasury_addresses" JSONB,
    "treasury_balance" JSONB,
    "ens_name" TEXT,
    "contract_addresses" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "wallet_addresses" JSONB NOT NULL,
    "auth_key_hash" TEXT NOT NULL,
    "ens_name" TEXT,
    "profile_data" JSONB,
    "onboarding_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "privacy_preferences" JSONB,
    "channels" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_keys" (
    "id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "status" "AuthKeyStatus" NOT NULL DEFAULT 'UNUSED',
    "assigned_employee_id" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "auth_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "from_employee_id" TEXT NOT NULL,
    "to_employee_id" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "blockchain_tx_hash" TEXT,
    "privacy_level" "PrivacyLevel" NOT NULL DEFAULT 'ORGANIZATION_ONLY',
    "encrypted_details" TEXT,
    "commitment_hash" TEXT,
    "nullifier" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gas_used" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merkle_trees" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "tree_root" TEXT NOT NULL,
    "tree_height" INTEGER NOT NULL,
    "leaves" JSONB NOT NULL,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_roots" JSONB,

    CONSTRAINT "merkle_trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state_channels" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "channel_state" JSONB NOT NULL,
    "deposit_amount" TEXT NOT NULL,
    "current_balance" TEXT NOT NULL,
    "status" "ChannelStatus" NOT NULL DEFAULT 'OPENING',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "settlement_tx_hash" TEXT,
    "metadata" JSONB,

    CONSTRAINT "state_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_transaction_approvals" (
    "id" TEXT NOT NULL,
    "approval_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "memo" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "rejection_reason" TEXT,
    "transaction_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_transaction_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "initiated_by" TEXT NOT NULL,
    "total_amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "employee_count" INTEGER NOT NULL,
    "payroll_data" JSONB NOT NULL,
    "blockchain_tx_hash" TEXT,
    "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_for" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "gas_used" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "log_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "affected_entity_type" TEXT NOT NULL,
    "affected_entity_id" TEXT NOT NULL,
    "encrypted_details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_organization_id_key" ON "organizations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_customer_id_key" ON "organizations"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_subscription_id_key" ON "organizations"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_ens_name_key" ON "organizations"("ens_name");

-- CreateIndex
CREATE INDEX "organizations_kyc_status_created_at_idx" ON "organizations"("kyc_status", "created_at");

-- CreateIndex
CREATE INDEX "organizations_organization_id_idx" ON "organizations"("organization_id");

-- CreateIndex
CREATE INDEX "organizations_admin_email_idx" ON "organizations"("admin_email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_id_key" ON "employees"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_auth_key_hash_key" ON "employees"("auth_key_hash");

-- CreateIndex
CREATE INDEX "employees_organization_id_status_idx" ON "employees"("organization_id", "status");

-- CreateIndex
CREATE INDEX "employees_auth_key_hash_idx" ON "employees"("auth_key_hash");

-- CreateIndex
CREATE INDEX "employees_employee_id_idx" ON "employees"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_keys_key_hash_key" ON "auth_keys"("key_hash");

-- CreateIndex
CREATE INDEX "auth_keys_organization_id_status_idx" ON "auth_keys"("organization_id", "status");

-- CreateIndex
CREATE INDEX "auth_keys_key_hash_idx" ON "auth_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_id_key" ON "transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "transactions_organization_id_timestamp_idx" ON "transactions"("organization_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_from_employee_id_timestamp_idx" ON "transactions"("from_employee_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_to_employee_id_timestamp_idx" ON "transactions"("to_employee_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_blockchain_tx_hash_idx" ON "transactions"("blockchain_tx_hash");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "merkle_trees_organization_id_key" ON "merkle_trees"("organization_id");

-- CreateIndex
CREATE INDEX "merkle_trees_organization_id_idx" ON "merkle_trees"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "state_channels_channel_id_key" ON "state_channels"("channel_id");

-- CreateIndex
CREATE INDEX "state_channels_employee_id_idx" ON "state_channels"("employee_id");

-- CreateIndex
CREATE INDEX "state_channels_organization_id_idx" ON "state_channels"("organization_id");

-- CreateIndex
CREATE INDEX "state_channels_status_idx" ON "state_channels"("status");

-- CreateIndex
CREATE UNIQUE INDEX "external_transaction_approvals_approval_id_key" ON "external_transaction_approvals"("approval_id");

-- CreateIndex
CREATE INDEX "external_transaction_approvals_organization_id_status_idx" ON "external_transaction_approvals"("organization_id", "status");

-- CreateIndex
CREATE INDEX "external_transaction_approvals_employee_id_status_idx" ON "external_transaction_approvals"("employee_id", "status");

-- CreateIndex
CREATE INDEX "external_transaction_approvals_status_requested_at_idx" ON "external_transaction_approvals"("status", "requested_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_payroll_id_key" ON "payroll_runs"("payroll_id");

-- CreateIndex
CREATE INDEX "payroll_runs_organization_id_created_at_idx" ON "payroll_runs"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_log_id_key" ON "audit_logs"("log_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_event_type_idx" ON "audit_logs"("event_type");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_keys" ADD CONSTRAINT "auth_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_employee_id_fkey" FOREIGN KEY ("from_employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_employee_id_fkey" FOREIGN KEY ("to_employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merkle_trees" ADD CONSTRAINT "merkle_trees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_transaction_approvals" ADD CONSTRAINT "external_transaction_approvals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
