# Admin Dashboard Documentation

## Overview

The Admin Dashboard provides a centralized interface for platform administrators to review and approve organization registrations. This ensures proper KYC compliance and quality control before organizations can access the TrustNet platform.

## Features

### Organization Approval System

- **View Pending Organizations**: See all organizations awaiting approval
- **Detailed Information Review**: Access complete organization details including:
  - Business information (legal name, registration number, country, industry)
  - Admin contact details
  - Subscription tier and billing information
  - KYC documents
  - Wallet addresses
- **Approve/Reject Actions**: Make decisions on organization applications with notes
- **Search and Filter**: Find specific organizations quickly
- **Status Tracking**: Monitor pending, approved, and rejected organizations

## Access the Admin Dashboard

1. Navigate to `/admin` in your browser
2. From there you can access:
   - `/admin/organizations` - Organization approval dashboard
   - `/admin/approvals` - Transaction approval system (if enabled)

## Using the Organization Approval Dashboard

### Step 1: View Pending Organizations

- The left panel shows all organizations awaiting approval
- Each card displays:
  - Organization name and legal business name
  - KYC status badge
  - Country and subscription tier
  - Registration date

### Step 2: Review Organization Details

Click on any organization card to view:

- **Company Information**
  - Registration number
  - Country and industry
  - Organization type
  - Website (if provided)
  - Business address

- **Admin Contact**
  - Name and job title
  - Email and phone number

- **Subscription Details**
  - Selected tier (STARTER, BUSINESS, ENTERPRISE)
  - Employee limit
  - Billing cycle
  - Payment status

- **KYC Documents**
  - Business certificates
  - Proof of address
  - Tax documents
  - Admin identification
  - Click on any document to download/view

### Step 3: Make a Decision

#### To Approve:
1. Review all information thoroughly
2. Optionally add approval notes
3. Click "Approve Organization"
4. Confirm the action
5. The organization status will change to APPROVED
6. Organization will gain platform access

#### To Reject:
1. Add a detailed rejection reason (required)
2. Click "Reject Organization"  
3. Confirm the action
4. The organization will be notified with your reason
5. They can reapply with corrections

## Search and Filters

- **Search Bar**: Search by organization name, legal name, email, or country
- **Status Filters**: Toggle between:
  - PENDING - Organizations awaiting review
  - ALL - View all organizations
  - APPROVED - Already approved
  - REJECTED - Previously rejected

## Database Configuration

The admin dashboard connects to NeonDB PostgreSQL database configured in the `.env` file:

```env
DATABASE_URL="postgresql://neondb_owner:npg_RziBeGIx5ay0@ep-royal-snow-abasgkac.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

## API Endpoints

The dashboard uses the following API endpoints:

- `GET /api/admin/organizations?status=PENDING` - Fetch organizations by status
- `GET /api/admin/organizations` - Fetch all organizations
- `PUT /api/admin/organizations/:id/approve` - Approve an organization
- `PUT /api/admin/organizations/:id/reject` - Reject an organization

## Running the System

### Backend Server

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:5001`

### Frontend (Next.js)

```bash
npm run dev
# or
bun run dev
```

The frontend runs on `http://localhost:3000`

### Access the Admin Dashboard

Open your browser and navigate to:
```
http://localhost:3000/admin
```

## Security Considerations

- **Admin Authentication**: In production, implement proper admin authentication
- **Audit Logging**: All approval/rejection actions are logged in the database
- **Document Verification**: Ensure all KYC documents are verified before approval
- **Payment Verification**: Check that payment status is COMPLETED before approval

## Database Schema

The admin dashboard interacts with the `Organization` model in Prisma:

Key fields:
- `kycStatus`: PENDING | APPROVED | REJECTED | EXPIRED
- `kycDocuments`: JSON object containing document URLs
- `verifiedAt`: Timestamp of approval
- `verificationNotes`: Admin notes from approval/rejection

## Troubleshooting

### Can't see any organizations
- Check that the backend server is running
- Verify DATABASE_URL in `.env` is correct
- Ensure organizations exist in the database with PENDING status

### API errors
- Check NEXT_PUBLIC_API_URL is set to `http://localhost:5001`
- Verify backend server is running and accessible
- Check network tab in browser dev tools for specific errors

### Documents not loading
- Verify document URLs in kycDocuments are valid
- Check CORS settings if documents are hosted externally
- Ensure proper file upload configuration

## Future Enhancements

- [ ] Email notifications for approved/rejected organizations
- [ ] Bulk approval/rejection
- [ ] Advanced filtering and sorting options
- [ ] Admin activity logs and audit trail
- [ ] Document preview without download
- [ ] Multi-admin support with role-based access
