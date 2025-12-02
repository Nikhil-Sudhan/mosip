# Migration Summary: JSON to PostgreSQL + Enhanced Workflow

This document summarizes all the changes made to transform the AgriQCert system to match the new requirements.

## ✅ Completed Changes

### 1. Database Migration (PostgreSQL)

**Files Created/Modified:**
- `backend/src/db/index.js` - PostgreSQL connection pool and schema initialization
- All service files migrated from JSON file storage to PostgreSQL

**Database Schema:**
- `users` - User accounts with roles
- `qa_agencies` - QA agency profiles with specialties
- `batches` - Batch submissions with QA assignment tracking
- `batch_documents` - Document attachments organized by category
- `batch_history` - Audit trail for batch status changes
- `inspections` - Inspection records with metrics
- `credentials` - Verifiable Credentials with wallet sharing status
- `sessions` - Refresh token management
- `audit_logs` - System audit trail
- `verification_activity` - Verification attempt logs

**Key Features:**
- Automatic schema creation on startup
- Proper foreign key relationships
- Indexes for performance
- Transaction support for data integrity

### 2. QA Agency Matching System

**Files Created:**
- `backend/src/services/qaAgencyService.js` - QA agency management and matching logic

**Features:**
- Automatic batch-to-QA agency matching based on:
  - Product type specialties
  - Agency workload (round-robin)
  - Agency availability
- QA agency profile management
- Inspection request assignment

### 3. Inspection Scheduling

**Files Created:**
- `backend/src/routes/qaRoutes.js` - QA-specific API routes
- `backend/src/controllers/qaController.js` - QA controller logic

**Features:**
- Schedule physical or virtual inspections
- Set inspection date/time and location
- Track inspection status (QA_ASSIGNED → INSPECTION_SCHEDULED)

### 4. Inji Certify Integration

**Files Modified:**
- `backend/src/services/credentialService.js` - Enhanced VC issuance

**Features:**
- Full Inji Certify integration for VC issuance
- Fallback mode for development/testing
- Real cryptographic signatures when configured

### 5. Inji Wallet Integration

**Files Created:**
- `backend/src/services/injiWalletService.js` - Wallet credential sharing

**Features:**
- Automatic credential sharing to exporter's Inji Wallet
- Email-based recipient identification
- Wallet sharing status tracking

### 6. Inji Verify Integration

**Files Modified:**
- `backend/src/services/verificationService.js` - Enhanced verification

**Features:**
- Inji Verify API integration for online verification
- Inji Certify verification as fallback
- Offline JSON upload verification support

### 7. Frontend Updates

**Files Created:**
- `frontend/src/pages/qa/QADashboard.jsx` - QA agency dashboard
- `frontend/src/api/qa.js` - QA API functions

**Files Modified:**
- `frontend/src/App.jsx` - Added QA route
- `frontend/src/utils/roleRoutes.js` - Updated QA route mapping

**Features:**
- Dedicated QA dashboard for inspection management
- Inspection scheduling UI
- Pending inspections list
- Status tracking and workflow management

### 8. Service Layer Migrations

All services migrated from JSON files to PostgreSQL:

- ✅ `userService.js` - User management
- ✅ `batchService.js` - Batch management with QA assignment
- ✅ `credentialService.js` - VC issuance with wallet integration
- ✅ `verificationService.js` - Verification with Inji Verify
- ✅ `auditService.js` - Audit logging
- ✅ `sessionService.js` - Session/token management

## 🔄 New Workflow

### Exporter Flow:
1. Login → Submit batch with product details and documents
2. System automatically assigns batch to QA agency
3. Receive notification when credential is issued
4. Credential appears in Inji Wallet (if configured)
5. Download QR code for packaging

### QA Agency Flow:
1. Login → View assigned batches in QA dashboard
2. Schedule inspection (physical/virtual) with date/time
3. Conduct inspection and record results
4. Issue credential if inspection passes

### Importer/Customs Flow:
1. Login → Access verification dashboard
2. Scan QR code or enter credential ID
3. View verification results with full certificate details

### Public Verification:
1. Access `/verify` portal (no login required)
2. Scan QR or upload JSON
3. View verification status and certificate details

## 📋 Configuration

### Required Environment Variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agriqcert

# Inji Services (optional but recommended)
INJI_CERTIFY_BASE_URL=https://certify.inji.io
INJI_CERTIFY_API_KEY=your-key
INJI_WALLET_BASE_URL=https://wallet.inji.io
INJI_WALLET_API_KEY=your-key
INJI_VERIFY_BASE_URL=https://verify.inji.io
INJI_VERIFY_API_KEY=your-key

# eSignet (for OAuth)
ESIGNET_BASE_URL=https://esignet.mosip.io
ESIGNET_CLIENT_ID=your-client-id
ESIGNET_CLIENT_SECRET=your-secret
```

## 🚀 Setup Instructions

1. **Install PostgreSQL** and create database:
   ```bash
   createdb agriqcert
   ```

2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env` in `backend/` directory
   - Set `DATABASE_URL` and other required variables

4. **Start services:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

5. **Access application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

## 📝 Notes

- Database schema is automatically created on first startup
- All JSON file stores have been replaced with PostgreSQL
- System works in fallback mode if Inji services are not configured
- QA agency profiles are automatically created when QA users are registered
- Batch-to-QA matching happens automatically on batch submission

## 🔍 Testing Checklist

- [ ] Database connection and schema creation
- [ ] User registration and login
- [ ] Batch submission and QA assignment
- [ ] Inspection scheduling
- [ ] Inspection recording
- [ ] Credential issuance
- [ ] Wallet sharing (if configured)
- [ ] Credential verification
- [ ] QA dashboard functionality

## 🐛 Known Issues / Future Improvements

- Consider adding email notifications for batch assignments
- Add batch status filtering in QA dashboard
- Implement batch reassignment if QA agency is unavailable
- Add more granular specialty matching for QA agencies
- Consider adding batch expiration/auto-rejection

