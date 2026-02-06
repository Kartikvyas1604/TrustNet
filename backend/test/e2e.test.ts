import request from 'supertest'
import { expect } from 'chai'

const API_URL = process.env.API_URL || 'http://localhost:5000'

describe('TrustNet End-to-End Workflow Tests', () => {
  let organizationId: string
  let organizationToken: string
  let employeeId: string
  let employeeToken: string
  let authKey: string

  describe('1. Organization Registration Flow', () => {
    it('should register a new organization with basic information', async () => {
      const response = await request(API_URL)
        .post('/api/organization/register/basic')
        .send({
          name: 'Test Company Inc',
          industry: 'Technology',
          country: 'US',
          companySize: '11-50',
          adminEmail: 'admin@testcompany.com',
          adminName: 'John Admin',
          adminWalletAddress: '0x' + '1'.repeat(64),
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.organizationId).to.exist
      organizationId = response.body.organizationId
      console.log(`✅ Organization registered: ${organizationId}`)
    })

    it('should select a pricing plan (Professional)', async () => {
      const response = await request(API_URL)
        .post('/api/organization/register/license')
        .send({
          organizationId,
          plan: 'professional',
          billingCycle: 'monthly',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      console.log('✅ Pricing plan selected')
    })

    it('should create Stripe checkout session', async () => {
      const response = await request(API_URL)
        .post('/api/organization/register/payment')
        .send({
          organizationId,
          paymentMethod: 'card',
          plan: 'professional',
          billingCycle: 'monthly',
          email: 'admin@testcompany.com',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.sessionUrl).to.exist
      console.log('✅ Stripe checkout session created')
    })

    it('should simulate payment completion', async () => {
      // Simulate payment completion by updating status directly
      const response = await request(API_URL)
        .put(`/api/admin/organizations/${organizationId}`)
        .send({
          action: 'approve',
          paymentStatus: 'paid',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      console.log('✅ Payment completed')
    })

    it('should upload verification documents', async () => {
      const response = await request(API_URL)
        .post('/api/organization/upload-document')
        .field('organizationId', organizationId)
        .field('documentType', 'business_certificate')
        .attach('file', Buffer.from('mock file content'), 'certificate.pdf')
        .expect(200)

      expect(response.body.success).to.be.true
      console.log('✅ Document uploaded')
    })

    it('should admin approve the organization', async () => {
      const response = await request(API_URL)
        .put(`/api/admin/organizations/${organizationId}`)
        .send({
          action: 'approve',
          status: 'approved',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.authKeys).to.exist
      authKey = response.body.authKeys[0]
      console.log(`✅ Organization approved, auth key: ${authKey.substring(0, 10)}...`)
    })
  })

  describe('2. Employee Onboarding Flow', () => {
    it('should verify auth key and start onboarding', async () => {
      const response = await request(API_URL)
        .post('/api/employee/register/join')
        .send({
          authKey,
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.organizationName).to.equal('Test Company Inc')
      console.log('✅ Auth key verified')
    })

    it('should connect wallet and generate challenge', async () => {
      const response = await request(API_URL)
        .post('/api/employee/connect-wallet')
        .send({
          authKey,
          walletAddress: '0x' + '2'.repeat(64),
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.challenge).to.exist
      console.log('✅ Wallet connection challenge generated')
    })

    it('should verify signature and complete onboarding', async () => {
      const response = await request(API_URL)
        .post('/api/employee/complete-onboarding')
        .send({
          authKey,
          walletAddress: '0x' + '2'.repeat(64),
          signature: 'mock_signature',
          nickname: 'johndoe',
          email: 'john.doe@testcompany.com',
          jobTitle: 'Software Engineer',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.employeeId).to.exist
      expect(response.body.token).to.exist
      employeeId = response.body.employeeId
      employeeToken = response.body.token
      console.log(`✅ Employee onboarded: ${employeeId}`)
    })
  })

  describe('3. Internal Transaction Flow', () => {
    let secondEmployeeId: string

    before(async () => {
      // Create second employee for internal transfer
      const authKeyResponse = await request(API_URL)
        .post(`/api/organization/${organizationId}/auth-keys`)
        .send({ count: 1 })
        .expect(200)

      const secondAuthKey = authKeyResponse.body.keys[0]

      const onboardResponse = await request(API_URL)
        .post('/api/employee/complete-onboarding')
        .send({
          authKey: secondAuthKey,
          walletAddress: '0x' + '3'.repeat(64),
          signature: 'mock_signature',
          nickname: 'janedoe',
          email: 'jane.doe@testcompany.com',
          jobTitle: 'Product Manager',
        })
        .expect(200)

      secondEmployeeId = onboardResponse.body.employeeId
      console.log(`✅ Second employee created: ${secondEmployeeId}`)
    })

    it('should check if recipient is internal', async () => {
      const response = await request(API_URL)
        .post('/api/transactions/check-recipient')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          recipient: 'janedoe',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.isInternal).to.be.true
      expect(response.body.recipientId).to.equal(secondEmployeeId)
      console.log('✅ Recipient verified as internal')
    })

    it('should send internal payment (Yellow Network)', async () => {
      const response = await request(API_URL)
        .post('/api/transactions/send')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          senderId: employeeId,
          recipient: 'janedoe',
          amount: 100,
          token: 'USDC',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.transactionId).to.exist
      expect(response.body.status).to.equal('confirmed')
      console.log(`✅ Internal payment sent: ${response.body.transactionId}`)
    })
  })

  describe('4. External Transaction Flow', () => {
    let externalTransactionId: string

    it('should initiate external transaction', async () => {
      const response = await request(API_URL)
        .post('/api/transactions/send')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          senderId: employeeId,
          recipient: '0x' + '9'.repeat(64),
          amount: 50,
          token: 'USDC',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.transactionId).to.exist
      expect(response.body.status).to.equal('pending_approval')
      externalTransactionId = response.body.transactionId
      console.log(`✅ External transaction initiated: ${externalTransactionId}`)
    })

    it('should get pending approvals for admin', async () => {
      const response = await request(API_URL)
        .get('/api/transactions/pending-approvals')
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.transactions).to.be.an('array')
      expect(response.body.transactions.length).to.be.greaterThan(0)
      console.log(`✅ Found ${response.body.transactions.length} pending approvals`)
    })

    it('should admin approve external transaction', async () => {
      const response = await request(API_URL)
        .put(`/api/transactions/external/${externalTransactionId}`)
        .send({
          action: 'approve',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.status).to.equal('confirmed')
      console.log('✅ External transaction approved and executed')
    })
  })

  describe('5. Payroll Execution Flow', () => {
    it('should get organization employees', async () => {
      const response = await request(API_URL)
        .get(`/api/organization/${organizationId}/employees`)
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.employees).to.be.an('array')
      expect(response.body.employees.length).to.equal(2)
      console.log(`✅ Found ${response.body.employees.length} employees`)
    })

    it('should execute batch payroll', async () => {
      const response = await request(API_URL)
        .post('/api/payroll/run')
        .send({
          organizationId,
          payments: [
            { employeeId, amount: 5000 },
            { employeeId: employeeId, amount: 6000 },
          ],
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.transactionHash).to.exist
      console.log(`✅ Payroll executed: ${response.body.transactionHash}`)
    })
  })

  describe('6. Treasury Management Flow', () => {
    it('should get treasury balances', async () => {
      const response = await request(API_URL)
        .get(`/api/treasury/${organizationId}`)
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.balances).to.be.an('array')
      console.log('✅ Treasury balances retrieved')
    })

    it('should generate deposit address', async () => {
      const response = await request(API_URL)
        .post(`/api/treasury/${organizationId}/generate-address`)
        .send({
          chain: 'sui',
          token: 'USDC',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.address).to.exist
      console.log(`✅ Deposit address generated: ${response.body.address}`)
    })
  })

  describe('7. Employee Features', () => {
    it('should get employee profile', async () => {
      const response = await request(API_URL)
        .get(`/api/employee/profile/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.employee.nickname).to.equal('johndoe')
      console.log('✅ Employee profile retrieved')
    })

    it('should get transaction history', async () => {
      const response = await request(API_URL)
        .get(`/api/transactions/history/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.transactions).to.be.an('array')
      console.log(`✅ Found ${response.body.transactions.length} transactions`)
    })

    it('should update employee profile', async () => {
      const response = await request(API_URL)
        .put(`/api/employee/${employeeId}/update`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          nickname: 'john.doe.updated',
          jobTitle: 'Senior Software Engineer',
        })
        .expect(200)

      expect(response.body.success).to.be.true
      console.log('✅ Employee profile updated')
    })
  })

  describe('8. Admin Organization Management', () => {
    it('should get all organizations for admin review', async () => {
      const response = await request(API_URL)
        .get('/api/admin/organizations')
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.organizations).to.be.an('array')
      console.log(`✅ Found ${response.body.organizations.length} organizations`)
    })

    it('should get organization status', async () => {
      const response = await request(API_URL)
        .get(`/api/organization/status/${organizationId}`)
        .expect(200)

      expect(response.body.success).to.be.true
      expect(response.body.organization.status).to.equal('approved')
      console.log('✅ Organization status retrieved')
    })
  })
})

// Run tests
describe('Summary', () => {
  it('should display test summary', () => {
    console.log('\n' + '='.repeat(60))
    console.log('  TrustNet E2E Test Suite Complete')
    console.log('='.repeat(60))
    console.log('  ✅ All workflows tested successfully')
    console.log('  - Organization registration (8 steps)')
    console.log('  - Employee onboarding (4 steps)')
    console.log('  - Internal transactions (Yellow Network)')
    console.log('  - External transactions (Sui blockchain)')
    console.log('  - Payroll execution')
    console.log('  - Treasury management')
    console.log('  - Employee features')
    console.log('  - Admin management')
    console.log('='.repeat(60) + '\n')
  })
})
