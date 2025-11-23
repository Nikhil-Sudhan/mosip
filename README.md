<div align="center">

# AgriQCert Portal

Web portal that lets exporters submit agricultural batches, QA partners record inspections, issue Verifiable Credentials (Digital Product Passports), and importers/customs verify credentials via QR or JSON upload.

</div>

## Features

- Role-based dashboards for **Exporter**, **QA/Admin**, and **Customs/Importer**
- Batch submission with attachments + lifecycle tracker
- QA inspection workspace with moisture/pesticide metrics
- Digital Product Passport (W3C VC) issuance, QR code download, revocation
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

Default admin login is `admin@agriqcert.test / Admin@123`. Create exporter/QA/customs users from the admin dashboard.

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




