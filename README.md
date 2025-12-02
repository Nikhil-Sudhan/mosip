<div align="center">

## AgriQCert Portal

Simple web portal that lets exporters submit agricultural batches, QA partners record inspections, issue Verifiable Credentials (Digital Product Passports), and importers/customs verify credentials via QR or JSON upload.

</div>

### Features

- **Dual Login System**: Separate login flows for Agency (Admin/QA/Customs) and Importers/Exporters
- **User Registration**: Importers and Exporters can create accounts directly
- **Role-based dashboards** for Exporter, QA/Admin, and Customs/Importer
- **Batch workflow** with approval / rejection and full audit trail
- **QA inspection workspace** with moisture/pesticide metrics
- **Digital Product Passport (VC)** issuance with QR code + revocation
- **Public verify page** for QR scanning or JSON upload
- **Dockerized** backend (Express) and frontend (React + Vite)

---

### 1. Prerequisites

- **PostgreSQL** (version 12 or higher)
- **Node.js** (version 20 or higher)
- **npm** or **yarn**

### 2. Database Setup

1. Create a PostgreSQL database:
```bash
createdb agriqcert
# Or using psql:
psql -U postgres
CREATE DATABASE agriqcert;
```

2. Update database connection in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agriqcert
```

The database schema will be automatically created on first startup.

### 3. Local development

```bash
# Install backend dependencies
cd backend
npm install

# Create .env file (copy from .env.example if available)
# Set DATABASE_URL and other required environment variables

# Start backend (will auto-create database schema)
npm run dev   # http://localhost:4000

# In a second terminal - Install frontend dependencies
cd ../frontend
npm install

# Start frontend
npm run dev   # http://localhost:5173
```

The frontend talks to the backend using `VITE_API_BASE_URL` (defaults to `http://localhost:4000/api` in dev).

---

### 2. Login credentials (demo defaults)

- **Agency (Admin/QA/Customs)**  
  - Email: `admin@gmail.com`  
  - Password: `admin`

- **Importers & Exporters**  
  - Use the registration page to create new accounts  
  - Or login with existing exporter/importer credentials

- **Legacy Admin (optional)**  
  - Email: `admin@agriqcert.test`  
  - Password: `Admin@123`

**For production**: change these default users right after the first login.

---

### 3. Docker deployment (production-style)

This runs the **API** and the **built frontend** together.

```bash
docker-compose up --build
```

- API → `http://localhost:4000`
- Web portal (built bundle) → `http://localhost:4173`

To customize for your server:

- **API secrets**: edit the `environment` block for the `api` service in `docker-compose.yml`  
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`  
  - `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`  
  - `PUBLIC_URL`, `VERIFY_PORTAL_URL`
- **Frontend base URL**: update `VITE_API_BASE_URL` build arg under the `web` service.

---

### 4. Project layout

```text
backend/   # Express API (auth, batches, VC, verification)
frontend/  # React + Vite app with Tailwind UI
docs/      # Architecture, API, and user-guide references
docker-compose.yml
```

---

### 5. Batch + credential workflow

1. **SUBMITTED** → Exporter submits batch with documents (product info, lab reports, images).
2. **QA_ASSIGNED** → System automatically matches batch to a certified QA agency based on:
   - Product type specialties
   - Agency workload (round-robin)
   - Agency availability
3. **INSPECTION_SCHEDULED** → QA agency schedules physical or virtual inspection with date/time/location.
4. **QA Inspection** → QA agency records inspection results:
   - `PASS` → status becomes `INSPECTED` (ready for credential issuance)
   - `FAIL` → status becomes `REJECTED` (cannot receive credential)
5. **Credential Issuance** → QA/Admin issues Verifiable Credential (Digital Product Passport):
   - VC issued via Inji Certify (if configured) or fallback method
   - QR code generated for verification
   - Credential automatically shared to exporter's Inji Wallet (if configured)
6. **CERTIFIED** → Batch receives Digital Product Passport (VC) with QR code.

**Important**: rejected batches are permanently blocked from credential issuance.

---

### 6. VC generation and verification modes

- **Production mode (Inji Certify)**  
  - Configure `INJI_CERTIFY_BASE_URL`, `INJI_CERTIFY_API_KEY`, and `INJI_ISSUER_DID` in `.env`
  - Configure `ESIGNET_*` variables for OAuth authentication
  - VCs are issued with real cryptographic signatures via Inji Certify
  - Credentials are automatically shared to exporter's Inji Wallet
  - Verification uses Inji Verify API for signature validation

- **Demo / fallback mode**  
  - If Inji Certify is not configured, system uses fallback method
  - Uses deterministic signature simulation for demos/testing
  - Still generates valid W3C VC structure with QR codes
  - Good for local development and testing without Inji services

---

### 7. Documentation

- `docs/architecture.md` – diagrams, components, VC flow
- `docs/api.md` – endpoint reference + sample payloads
- `docs/user-guide.md` – role-based walkthrough (Exporter, QA, Customs)
- `AgriQCertDesign.md` – extended backlog & roadmap

---

### 8. Tech stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Query, Zustand
- **Backend**: Node.js 20, Express 5, PostgreSQL
- **Database**: PostgreSQL (with automatic schema migration)
- **VC Issuance**: Inji Certify integration (with fallback)
- **VC Verification**: Inji Verify integration (with fallback)
- **Wallet Integration**: Inji Wallet for credential sharing
- **QR Code**: qrcode library for QR generation
- **Authentication**: JWT with refresh tokens, eSignet OAuth support

---

### 9. Testing & linting

```bash
cd backend && npm test
cd frontend && npm run lint
```

---

### 10. Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agriqcert

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Inji Certify (for VC issuance)
INJI_CERTIFY_BASE_URL=https://certify.inji.io
INJI_CERTIFY_API_KEY=your-api-key
INJI_ISSUER_DID=did:mosip:your-issuer-id

# Inji Wallet (for credential sharing)
INJI_WALLET_BASE_URL=https://wallet.inji.io
INJI_WALLET_API_KEY=your-api-key

# Inji Verify (for credential verification)
INJI_VERIFY_BASE_URL=https://verify.inji.io
INJI_VERIFY_API_KEY=your-api-key

# eSignet (for OAuth)
ESIGNET_BASE_URL=https://esignet.mosip.io
ESIGNET_CLIENT_ID=your-client-id
ESIGNET_CLIENT_SECRET=your-secret
```

### 11. Production checklist (minimum)

- **Secrets**: set strong values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- **Database**: ensure PostgreSQL is properly configured with backups
- **Admin users**: log in with the default admin, create new admins, then **disable / change** the defaults.
- **Inji Integration**: configure all Inji service URLs and API keys for production
- **TLS**: run behind HTTPS (NGINX, reverse proxy, or a cloud load balancer).
- **Monitoring**: add basic logging/metrics and regular database backups.
