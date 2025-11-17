## Architecture Overview

```
┌──────────────┐        JWT        ┌──────────────┐
│  React Web   │  ───────────────► │  Express API │
│  (Vite)      │   fetch / axios   │  (Node 20)   │
└─────┬────────┘                   └──────┬───────┘
      │                                    │
      │ React Query                        │ Services (auth, batches, VC, verify)
      │ Zustand auth store                 │ JSON file stores (users, batches, credentials,
      │                                    │ inspections, audit, verification logs)
      ▼                                    ▼
┌──────────────┐        QR+VC        ┌──────────────┐
│ Inji Verify  │ ◄────────────────── │ VC Service   │
│ (public page)│   download/scan     │ (QRCode lib) │
└──────────────┘                     └──────────────┘
```

### Components

- **Frontend (`frontend/`)**
  - React + Vite SPA with Tailwind styling.
  - React Router routes per role (`/admin`, `/exporter`, `/customs`, `/verify`).
  - React Query handles API calls, caching, and background refetches.
  - Zustand stores JWT/user data and gates protected routes.
  - QR scanning via `@yudiel/react-qr-scanner`; verification UI reused across customs and public portal.

- **Backend (`backend/`)**
  - Express 5 server with CORS + JWT middleware.
  - JSON stores under `src/data/` used instead of PostgreSQL for hackathon agility (same services can later wrap Prisma/Knex).
  - Multer stores uploads in `/uploads` (exposed via `/uploads/<file>`).
  - Services:
    - `batchService` → create batches, append docs, record inspections, maintain history.
    - `credentialService` → build DPP VC payload, generate QR codes (qrcode lib), log issuance, handle revocation.
    - `verificationService` → verify by credential ID (online) or uploaded JSON (offline), log activity + audit entries.
    - `templateService` → manage VC template metadata.
    - `auditService` → append actions to `auditLogs.json`.

### Credential & Verification Flow

1. **Exporter** submits batch + attachments → status `SUBMITTED`.
2. **QA/Admin** logs inspection metrics via `/api/batches/:id/inspection` → status `INSPECTED`.
3. **QA/Admin** triggers `/api/vc/:batchId/issue`:
   - Builds W3C VC JSON (Digital Product Passport schema).
   - Adds proof placeholder, DID info, and inspection data.
   - Generates QR data URL pointing to `/api/verify/:credentialId` and shareable portal link `/verify?credential=...`.
4. Credential stored under `src/data/credentials.json`; batch history moves to `CERTIFIED`.
5. **Customs/Importer** verifies:
   - Logged-in customs uses `/customs` dashboard to scan QR or enter ID (calls `/api/verify/:id`).
   - Public `VerifyPortal` page lets anyone scan or upload JSON (calls `/api/verify/:id` or `/api/verify/upload`).
6. Verification service validates signature (deterministic JWS), expiry, revocation flag, logs result + summary for dashboards.

### Security & Extensibility Notes

- Passwords hashed with bcrypt, JWT issued for 15m/7d (access/refresh).
- Refresh tokens stored as SHA-256 hashes (`sessionService`).
- Role guard middleware ensures exporters cannot hit QA/admin endpoints.
- `.env` (or compose env) controls secrets, public URLs, and issuer DID.
- Replacing JSON storage:
  - Swap `fileStore` calls with DB queries (Knex/Prisma) but keep controller contracts identical.
  - Attachments can move to S3/MinIO; store URLs + checksums instead of filenames.
- Production improvements: move private signing key to HSM/secret manager, integrate MOSIP eSignet + Inji Certify APIs, enforce revocation lists (RevocationList2020), persist audit logs centrally.

