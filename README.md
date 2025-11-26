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

### 1. Local development (simple way)

```bash
# backend
cd backend
npm install
npm run dev   # http://localhost:4000

# in a second terminal
cd ../frontend
npm install
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

1. **SUBMITTED** → Exporter submits batch with documents.
2. **QA Inspection** → QA/Admin records inspection results:
   - `PASS` → status becomes `INSPECTED` (ready for credential issuance)
   - `FAIL` → status becomes `REJECTED` (cannot receive credential)
3. **Credential Issuance** → only `INSPECTED` batches with `PASS` result can receive credentials.
4. **CERTIFIED** → batch receives a Digital Product Passport (VC) with QR code.

**Important**: rejected batches are permanently blocked from credential issuance.

---

### 6. VC generation modes (simple view)

- **Default / demo mode**  
  - Uses **local JSON files** and a **deterministic “fake” signature** to simulate a Verifiable Credential.
  - Good for hackathons, demos, and local testing.

- **Real INJI / MOSIP integration (optional)**  
  - When `INJI_CERTIFY_*` and `ESIGNET_*` env vars are configured, the backend can call **real INJI Certify** / **eSignet** to issue VCs.
  - This is the path to make the system production-grade in a real MOSIP deployment.

---

### 7. Documentation

- `docs/architecture.md` – diagrams, components, VC flow
- `docs/api.md` – endpoint reference + sample payloads
- `docs/user-guide.md` – role-based walkthrough (Exporter, QA, Customs)
- `AgriQCertDesign.md` – extended backlog & roadmap

---

### 8. Tech stack

- **Frontend**: React 19, Vite, Tailwind, React Query, Zustand
- **Backend**: Node.js 20, Express 5, Zod, Multer, QRCode
- **VC / Verification**: JSON store simulating Inji Certify/Verify with DID + Ed25519-like signing logic

---

### 9. Testing & linting

```bash
cd backend && npm test
cd frontend && npm run lint
```

---

### 10. Production checklist (minimum)

- **Secrets**: set strong values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- **Admin users**: log in with the default admin, create new admins, then **disable / change** the defaults.
- **Storage**: the current setup uses JSON files; for serious production, move to PostgreSQL (via Prisma/Knex).
- **TLS**: run behind HTTPS (NGINX, reverse proxy, or a cloud load balancer).
- **Monitoring**: add basic logging/metrics and regular backups for the JSON/DB storage.
