import { Router } from 'express';
import authRoutes from '../../../routes/auth';
import walletAuthRoutes from '../../../routes/wallet-auth';
import ensRoutes from '../../../routes/ens';
import organizationRoutes from '../../../routes/organizations';
import organizationRegistrationRoutes from '../../../routes/organization-registration';
import employeeRoutes from '../../../routes/employees';
import employeeOnboardingRoutes from '../../../routes/employee-onboarding';
import transactionRoutes from '../../../routes/transactions';
import transactionFlowRoutes from '../../../routes/transaction-flow';
import treasuryPayrollRoutes from '../../../routes/treasury-payroll';
import paymentRoutes from '../../../routes/payment';
import uploadRoutes from '../../../routes/upload';
import adminRoutes from '../../../routes/admin';

const router = Router();

// ======================
// AUTHENTICATION
// ======================
router.use('/auth', authRoutes);
router.use('/auth/wallet', walletAuthRoutes);

// ======================
// IDENTITY & ENS
// ======================
router.use('/ens', ensRoutes);

// ======================
// ORGANIZATIONS
// ======================
router.use('/organizations', organizationRoutes);
router.use('/organization', organizationRegistrationRoutes); // Registration flow

// ======================
// EMPLOYEES
// ======================
router.use('/employees', employeeRoutes);
router.use('/employee', employeeOnboardingRoutes); // Onboarding flow

// ======================
// TRANSACTIONS
// ======================
router.use('/transactions', transactionRoutes);
router.use('/transactions', transactionFlowRoutes); // Transaction orchestration flow

// ======================
// TREASURY & PAYROLL
// ======================
router.use('/treasury', treasuryPayrollRoutes);
router.use('/payroll', treasuryPayrollRoutes);

// ======================
// PAYMENTS
// ======================
router.use('/payment', paymentRoutes);

// ======================
// FILE UPLOADS
// ======================
router.use('/upload', uploadRoutes);

// ======================
// ADMIN
// ======================
router.use('/admin', adminRoutes);

export default router;
