<div align="center">

# AgriQCert Portal

Web portal that lets exporters submit agricultural batches, QA partners record inspections, issue Verifiable Credentials (Digital Product Passports), and importers/customs verify credentials via QR or JSON upload.

</div>

## Features

- **Dual Login System**: Separate login flows for Agency (Admin/QA/Customs) and Importers/Exporters
- **User Registration**: Importers and Exporters can create accounts directly
- Role-based dashboards for **Exporter**, **QA/Admin**, and **Customs/Importer**
- **Batch Approval/Rejection Workflow**: 
  - Batches must pass QA inspection before credential issuance
  - Rejected batches cannot receive credentials
  - Full audit trail of batch status changes
- Batch submission with attachments + lifecycle tracker
- QA inspection workspace with moisture/pesticide metrics
- Digital Product Passport (W3C VC) issuance (only for approved batches), QR code download, revocation
- Public Inji Verify-style page for QR scanning or JSON upload
- Audit + verification activity logs backed by JSON stores (swap with PostgreSQL later)
- Dockerized backend (Express) and frontend (React + Vite)

## Quick start

```bash
# backend
cd backend
npm install
npm run dev   # http://localhost:4000

# frontend
cd ../frontend
npm install
npm run dev   # http://localhost:5173
```

### Login Credentials

**Agency Login** (Admin/QA/Customs):
- Email: `admin@gmail.com`
- Password: `admin`

**Importers & Exporters Login**:
- Use the registration page to create new accounts
- Or login with existing exporter/importer credentials

**Legacy Admin** (if needed):
- Email: `admin@agriqcert.test`
- Password: `Admin@123`

### Docker (single command)

```bash
docker-compose up --build
```

- API → http://localhost:4000
- Web portal (built bundle) → http://localhost:4173

## Project layout

```
backend/   # Express API (JWT auth, batches, VC, verification)
frontend/  # React + Vite app with Tailwind UI
docs/      # Architecture, API, and user-guide references
docker-compose.yml
```

## Batch Workflow

1. **SUBMITTED** → Exporter submits batch with documents
2. **QA Inspection** → QA/Admin records inspection results:
   - **PASS** → Status becomes `INSPECTED` → Ready for credential issuance
   - **FAIL** → Status becomes `REJECTED` → Cannot receive credential
3. **Credential Issuance** → Only `INSPECTED` batches with `PASS` result can receive credentials
4. **CERTIFIED** → Batch receives Digital Product Passport (VC) with QR code

**Important**: Credentials can only be issued for batches that have passed inspection. Rejected batches are permanently blocked from credential issuance.

## Documentation

- `docs/architecture.md` – diagrams, components, VC flow
- `docs/api.md` – endpoint reference + sample payloads
- `docs/user-guide.md` – role-based walkthrough (Exporter, QA, Customs)
- `AgriQCertDesign.md` – extended backlog & roadmap

## Tech stack

- **Frontend**: React 19, Vite, Tailwind, React Query, Zustand
- **Backend**: Node.js 20, Express 5, Zod, Multer, QRCode
- **VC / Verification**: JSON store simulating Inji Certify/Verify with DID + Ed25519-like signing logic

## Testing & linting

```bash
cd backend && npm test
cd frontend && npm run lint
```

## Next steps

- Swap JSON stores with PostgreSQL/Prisma
- Hook to real MOSIP eSignet + Inji Certify APIs
- Add Storybook/Cypress coverage and localization




