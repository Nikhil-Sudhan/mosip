# AgriQCert Blueprint

This document explains how to build the AgriQCert portal using a simple React + Node.js + PostgreSQL stack while simulating MOSIP parts (eSignet login, Inji Certify, Inji Verify). Everything runs locally or inside Docker for hackathon demos.

---

## 1. Requirements & Roles

### Core users
- **Exporter** – logs in, registers product batches, uploads lab reports, tracks status, downloads the issued VC and QR.
- **QA Agency** – sees assigned batches, records inspection findings, issues the Digital Product Passport (DPP).
- **Importer / Customs** – scans the QR or uploads the VC JSON to verify authenticity before clearance.
- **Admin** – manages users, templates, and can revoke credentials.

### Workflow recap
1. Exporter authenticates (mock eSignet) and submits batch data: product, quantity, origin, destination, files (images, lab PDFs).
2. System assigns a QA agency; QA user inspects and records readings (moisture %, pesticide ppm, ISO/organic tags).
3. QA agency issues a VC (Digital Product Passport) using the recorded readings; exporter receives a downloadable JSON and QR.
4. Exporter prints/embeds the QR on documents or packaging.
5. Importer scans the QR in the portal (simulating Inji Verify), which fetches the VC, checks proof metadata, expiry, and revocation flag, then shows the verdict.

### Hackathon-friendly simplifications
- Fake eSignet: normal username/password with JWT tokens. Mention upgrade path in docs.
- Fake Inji Certify: Node service creates VC JSON and signs it using a locally stored Ed25519 key.
- Fake Inji Verify: Verification view simply recomputes signature, compares schema, and checks revocation table.

---

## 2. Architecture & Security Notes

### High-level components
1. **Frontend (React + Vite + Tailwind)** – role-based dashboards, forms, QR scanner (using `react-qr-reader`), status timeline.
2. **Backend (Node.js + Express)** – REST APIs, business logic, role guard middleware, VC generator, file uploads (Multer to local `/uploads` or S3-compatible bucket).
3. **Database (PostgreSQL)** – stores users, batches, inspections, credentials, audit logs.
4. **Credential Service** – simple module that builds the VC JSON, signs it with Ed25519 (libsodium), and stores both JSON and a short ID.
5. **QR Service** – generates QR PNG from a verification URL (`/verify/:credentialId`) using the `qrcode` npm package.
6. **Object Storage (optional)** – MinIO/S3 bucket for attachments; store reference URL + checksum inside DB.
7. **Docker Compose** – brings up `client`, `api`, `db`, and `minio` services for demos; environment variables live inside `.env`.

### Security basics (simple but clear)
- Hash passwords with bcrypt; store salts.
- Use JWT access tokens (15 min) plus refresh tokens (7 days) kept in HTTP-only cookies.
- Enforce RBAC via middleware: `requireRole(['EXPORTER'])`, etc.
- Validate payloads with Zod or Joi; reject oversized uploads (>10 MB each).
- Sanitize filenames, scan attachments using an external CLI (future).
- Keep private signing key in `.env` for hackathon; explain that in production it belongs in HSM/secret manager.
- Enable CORS only for known origins (`http://localhost:5173` during dev).
- Log every issuance, verification, and revocation event in `audit_logs`.

---

## 3. Data Model & Status Flow

| Table | Purpose | Key Columns |
| --- | --- | --- |
| `roles` | Static list of roles | `id`, `name` (`EXPORTER`, `QA`, `IMPORTER`, `ADMIN`) |
| `users` | Portal accounts | `id`, `email`, `password_hash`, `role_id`, `organization`, `is_active`, timestamps |
| `batches` | Exporter submissions | `id`, `exporter_id`, `product_type`, `variety`, `quantity`, `unit`, `origin_country`, `destination_country`, `harvest_date`, `docs` (JSON array of file refs), `status` |
| `qa_assignments` | Link between batch and QA agency | `id`, `batch_id`, `qa_agency_id`, `assigned_at`, `scheduled_at`, `notes` |
| `inspections` | QA inputs | `id`, `batch_id`, `inspector_id`, `moisture_pct`, `pesticide_ppm`, `organic_cert`, `iso_code`, `remarks`, `result` (`PASS`/`FAIL`), `completed_at` |
| `verifiable_credentials` | Digital Product Passports | `id` (UUID), `batch_id`, `credential_json` (JSONB), `qr_url`, `issued_by`, `issued_at`, `expires_at`, `status` (`ACTIVE`, `REVOKED`, `EXPIRED`) |
| `audit_logs` | Traceability | `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at` |

### Status enums
- Batch lifecycle: `SUBMITTED → UNDER_REVIEW → INSPECTION_SCHEDULED → INSPECTED → CERTIFIED → SHIPPED → VERIFIED`.
- Credential lifecycle: `DRAFT → ACTIVE → REVOKED → EXPIRED`.

### Sample batch record
```json
{
  "product_type": "Turmeric",
  "quantity": 5000,
  "unit": "kg",
  "origin_country": "India",
  "destination_country": "EU",
  "status": "CERTIFIED"
}
```

---

## 4. Digital Product Passport VC

### Schema
```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://schema.org",
    "https://mosip.io/dpp/v1"
  ],
  "type": ["VerifiableCredential", "DigitalProductPassport"],
  "issuer": "did:example:qa-agency-001",
  "issuanceDate": "2025-01-15T10:00:00Z",
  "expirationDate": "2026-01-15T10:00:00Z",
  "credentialSubject": {
    "id": "did:example:batch-9f31",
    "product": {
      "name": "Turmeric",
      "batchNumber": "TUR-9F31",
      "hsCode": "0910.30",
      "quantity": "5000 kg",
      "destination": "Rotterdam Port"
    },
    "inspection": {
      "moisturePercent": 8.5,
      "pesticidePPM": 0.2,
      "isoCode": "ISO 22000",
      "organicStatus": "NOP Certified",
      "result": "PASS"
    }
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2025-01-15T10:00:05Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:example:qa-agency-001#key-1",
    "jws": "BASE64URL_SIGNATURE"
  }
}
```

### Rules
- `issuer` is the DID of the QA agency; store DID doc in config.
- `credentialSubject.id` ties back to the batch DID (constructed as `did:example:batch:<uuid>`).
+- `proof.jws` uses libsodium; verification uses the same public key advertised at `/.well-known/did.json`.
- Expiry defaults to 1 year after issuance but can be overridden per product.
- For revocation, add `status`:
```json
"credentialStatus": {
  "id": "https://api.agriqcert.io/revocations/dpp-9f31",
  "type": "RevocationList2020Status",
  "revocationListIndex": "45",
  "revocationListCredential": "https://api.agriqcert.io/revocations/list.json"
}
```

---

## 5. REST API Design

### Auth & User
| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Email + password → access & refresh tokens. |
| POST | `/api/auth/refresh` | Refresh token → new access token. |
| POST | `/api/auth/logout` | Invalidates refresh token. |
| POST | `/api/users` (admin) | Create exporter/QA/importer accounts. |

**Success response example**
```json
{ "accessToken": "...", "refreshToken": "...", "user": { "id": 3, "role": "QA" } }
```

### Exporter
| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/batches` | Create batch with metadata + attachments. |
| GET | `/api/batches` | List own batches (filters by status). |
| GET | `/api/batches/:id` | Fetch batch timeline + inspection notes. |
| PUT | `/api/batches/:id/documents` | Add extra evidence files. |

### QA Agency
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/qa/assignments` | Paginated list of assigned batches. |
| POST | `/api/qa/assignments/:id/schedule` | Set inspection datetime + notes. |
| POST | `/api/qa/inspections` | Submit readings + PASS/FAIL. |

### VC Issuance
| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/vc/:batchId/issue` | Generates VC JSON + QR; only QA or Admin. |
| GET | `/api/vc/:batchId` | Download VC JSON (Exporter, QA, Admin). |
| POST | `/api/vc/:id/revoke` | Admin marks VC as revoked; adds audit entry. |

### Verification / Importer
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/verify/:credentialId` | Returns parsed VC, signature check result, revocation state. |
| POST | `/api/verify/upload` | Accepts VC JSON file for offline verification. |

### Admin & Utilities
| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/audit` | Search audit logs by action/date/user. |
| GET | `/api/stats` | Dashboard counts for batches, inspections, verification attempts. |

### Common response format
```json
{
  "success": true,
  "data": { "...": "..." },
  "meta": { "requestId": "abc123" }
}
```

### Error format
```json
{
  "success": false,
  "error": {
    "code": "BATCH_NOT_FOUND",
    "message": "Batch does not exist",
    "details": {}
  }
}
```

### Middleware
- `authMiddleware` – verifies JWT, loads user.
- `roleGuard([...roles])` – ensures role match.
- `validate(schema)` – JSON body validation.
- `upload.single('file')` – handles attachments.
- `asyncHandler` – wraps controllers to avoid try/catch clutter.

---

## 6. QR & Verification UX

1. **QR payload** – keep it small: `https://api.agriqcert.local/verify/dpp-uuid`. Optionally add a signed token to prevent tampering.
2. **Generation** – after issuing VC, backend stores QR PNG and shares a short-lived download URL; frontend shows preview and “Download QR” button.
3. **Importer flow**:
   - Importer visits `/verify`.
   - Option A: camera scan (WebRTC) → fetch credential ID → call GET `/api/verify/:id`.
   - Option B: upload VC JSON file → POST `/api/verify/upload`.
   - Backend checks: schema compliance, signature, issuance + expiry dates, revocation list entry, matches batch data.
   - UI displays card with issuer, product summary, status chip (Verified / Revoked / Expired), and inspection highlights.
4. **Audit logging** – every verification stores `actor` (`IMPORTER` or `ANON`), credential ID, result, and timestamp.

---

## 7. Documentation & User Guide Outline

1. **README.md**
   - Problem intro, feature list, screenshots.
   - Quick start (Docker + manual install).
   - Tech stack + MOSIP simulation note.
2. **docs/architecture.md**
   - Diagrams, sequence explanation, security assumptions.
3. **docs/api.md**
   - Swagger link, endpoint table, sample curl commands.
4. **docs/vc-schema.md**
   - JSON schema, DID setup, signing steps.
5. **docs/user-guide.md**
   - Exporter walkthrough: login → submit → track.
   - QA walkthrough: accept request → log inspection → issue VC.
   - Importer walkthrough: scan or upload VC.
   - Admin actions: create users, revoke VC.
6. **docs/testing.md**
   - Unit tests (service + validator), integration tests (auth, batch flow), postman collection.
7. **docs/future-work.md**
   - Real eSignet integration, real Inji Certify APIs, hardware HSM, multilingual UI, digital twin view.

---

## 8. Implementation Roadmap & Testing

1. **Milestone 1 – Auth & Roles**
   - Implement login, JWT, role guard, seed Admin + sample users.
   - Jest tests for auth controller + middleware.
2. **Milestone 2 – Exporter Batch Flow**
   - Batch form, file uploads, status timeline.
   - Cypress test for submit + list.
3. **Milestone 3 – QA Inspection**
   - Assignment list, inspection form, pass/fail logic, audit log entry.
4. **Milestone 4 – VC Issuance & QR**
   - Implement VC builder, Ed25519 signing, QR creation, download endpoints.
   - Snapshot tests for VC JSON.
5. **Milestone 5 – Verification Portal**
   - QR scanner, upload option, verification endpoint, revocation handling.
   - Integration test mocking signed VC + revocation matrix.
6. **Milestone 6 – Extras**
   - Progress tracker UI, admin dashboard, audit log viewer, optional multilingual toggle.
7. **Deployment**
   - Docker Compose (`client`, `api`, `db`, `minio`).
   - GitHub Actions workflow for lint + tests + docker build.
   - Instructions for pushing containers to Render/railway/Azure.

With this roadmap the team can demo an end-to-end story in the hackathon while still pointing to real MOSIP components for future integration.

---

## 9. Detailed Milestones (Frontend Focus)

| Milestone | Goal | Key Frontend Deliverables | Backend Support |
| --- | --- | --- | --- |
| 2. Exporter Workspace | Let exporters register and track batches | Login redirect, dashboard cards, batch submission wizard with drag-drop uploads, activity timeline component | `/api/batches` CRUD, file upload endpoint |
| 3. QA Operations | QA agency receives assignments & submits results | Kanban view (New / Scheduled / Done), inspection form with validation chips, status badges | `/api/qa/*` endpoints, audit logging |
| 4. VC Issuance & QR | Show inspection summary + allow VC download | Credential preview drawer, “Generate VC” button w/ toast, QR modal with download buttons | `/api/vc/:batchId/issue`, `/api/vc/:batchId` |
| 5. Verification Portal | Importer/customs verifies credentials | Public `/verify` route, QR scanner component, upload dropzone, result cards (Verified/Revoked) | `/api/verify/:id`, `/api/verify/upload` |
| 6. Admin & Extras | Manage users + advanced features | Admin table with inline role edits, audit log table, progress tracker timeline component, language toggle | `/api/users`, `/api/audit`, `/api/stats` |

---

## 10. Frontend Architecture & Tooling

1. **Stack**
   - React + Vite (fast dev server), Tailwind CSS for rapid styling.
   - React Router for multi-role navigation; protected routes check JWT from localStorage.
   - TanStack Query (React Query) handles API calls, caching, loading states.
   - Zustand or Context for lightweight global auth state (user info + tokens).
2. **Project Structure**
   ```
   frontend/
   ├─ src/
   │  ├─ api/          # axios wrapper + endpoints
   │  ├─ components/   # reusable UI
   │  ├─ layouts/      # shared shells per role
   │  ├─ pages/
   │  │  ├─ exporter/
   │  │  ├─ qa/
   │  │  ├─ verify/
   │  │  └─ admin/
   │  └─ store/        # auth + UI state
   └─ public/
   ```
3. **Styling**
   - Tailwind + Headless UI for dialogs/dropdowns.
   - DaisyUI or custom theme tokens to keep color palette consistent with MOSIP branding (blue/green).
4. **Forms & Validation**
   - `react-hook-form` + `zod` for schema validation so frontend stays in sync with backend.
5. **Notifications**
   - `react-hot-toast` for simple success/error messages.

---

## 11. Page & Component Design

1. **Authentication**
   - `/login` page with email/password fields, “Remember me” toggle, inline error messages.
   - After login, redirect based on role (`/exporter`, `/qa`, `/admin`, `/verify`).
2. **Exporter Dashboard**
   - KPI cards (Active Batches, Awaiting QA, Certified).
   - “Submit New Batch” wizard: Step 1 product info, Step 2 attachments, Step 3 review.
   - Batch table with status chips and CTA buttons (“View details”, “Upload docs”).
   - Timeline modal showing lifecycle statuses.
3. **QA Dashboard**
   - Assignment board with filters by commodity, due date.
   - Inspection form using tabs (Readings, Attachments, Notes).
   - Quick actions: “Schedule inspection”, “Mark complete”.
4. **VC Issuance Drawer**
   - Summary card showing inspection metrics.
   - Button triggers modal explaining Inji simulation.
   - After issuance, show VC JSON snippet and QR preview with download options.
5. **Verification Portal (Public)**
   - Split view: left has QR scanner feed, right shows upload dropzone.
   - Result panel with issuer info, status pill, schema check list (Issuer ✓, Signature ✓, Revocation ✓).
6. **Admin Area**
   - User management table with filters per role, “Add user” dialog.
   - Audit log table with search + export CSV.
   - Progress tracker page showing each batch’s journey (timeline component reused).
7. **Responsive Behavior**
   - Mobile nav drawer, stacked cards, QR scanner fallback (upload photo) if camera unavailable.

---

## 12. API Integration & State Management

1. **HTTP Client**
   - Axios instance with `baseURL = /api`, interceptors for attaching access token and auto-refresh when 401 occurs.
   - On refresh failure, redirect to login and clear auth state.
2. **Auth Flow**
   - Store tokens in memory + localStorage (only access token if you prefer). Keep refresh token in httpOnly cookie once backend adds it; for now, store string but document security upgrade.
   - `useAuthGuard()` hook verifies role before rendering a route.
3. **Data Fetching**
   - React Query hooks: `useBatches`, `useAssignments`, `useCredential`, `useVerification`.
   - Optimistic updates for batch status changes and user creation.
4. **File Uploads**
   - Use `FormData` via Axios; show upload progress bar.
   - Store uploaded file metadata in React Query cache to prevent re-fetch.
5. **State Synchronization**
   - When QA issues a VC, invalidate both `batches` and `credentials` queries to show new data everywhere.
   - Maintain a `notifications` slice (Zustand) for showing cross-page alerts (e.g., “VC issued successfully”).
6. **Error Handling**
   - Global error boundary for catastrophic failures.
   - Axios interceptor maps backend `{ success:false, error }` to toast messages + inline form errors.

---

## 13. Frontend Testing & Deployment

1. **Testing**
   - Unit: React Testing Library for form components, buttons, QR modal.
   - Integration: Cypress for login, batch submission, QA inspection, verification flows.
   - Mock Service Worker (MSW) to stub backend responses during unit/integration tests.
   - Visual regression (optional) via Chromatic/Storybook snapshots for key components.
2. **CI/CD**
   - GitHub Actions job `frontend.yml`:
     - `npm ci`
     - `npm run lint`
     - `npm run test -- --runInBand`
     - `npm run build`
     - Upload build artifacts.
3. **Deployment**
   - Vercel/Netlify for static hosting; configure proxy to backend API.
   - For Docker-based deploys, extend `docker-compose.yml` with `client` service (Vite build served via Nginx).
   - Add environment variables (`VITE_API_BASE_URL`, `VITE_INJI_VERIFY_URL`).
4. **Monitoring**
   - Simple browser logging via Sentry Lite or LogRocket (optional).
   - Frontend health endpoint hitting `/api/health` and showing banner if backend unreachable.

These additions give a clear path to ship the remaining milestones with a beginner-friendly but production-minded React frontend that mirrors MOSIP concepts while staying fully self-contained for hackathon demos.

