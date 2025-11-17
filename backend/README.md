# AgriQCert Backend (Milestone 1)

Simple Node.js API that powers milestone 1 (auth + role management) for the AgriQCert portal. It uses Express, JSON Web Tokens, and lightweight JSON files instead of a full database so you can demo quickly and swap in PostgreSQL later.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy the sample env file and update secrets if you like:
   ```bash
   copy .env.example .env   # use cp on mac/linux
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

When the server boots it creates JSON stores under `backend/data/`:

- `users.json` – hashed passwords.
- `sessions.json` – hashed refresh tokens.
- `batches.json` – exporter batch submissions.

Uploaded documents are saved to `backend/uploads/` (git ignored) and exposed via `/uploads/<filename>`.

The first run also seeds a default admin:

- Email: `admin@agriqcert.test`
- Password: `Admin@123`

Change this password immediately after logging in by creating a new admin user, then disabling the default one (future milestone).

## Available Endpoints

Base URL: `http://localhost:4000/api`

### Health

- `GET /health` → `{ "success": true, "data": { "status": "ok" } }`

### Auth

1. **Login**
   ```
   POST /auth/login
   {
     "email": "admin@agriqcert.test",
     "password": "Admin@123"
   }
   ```
   Response returns `accessToken`, `refreshToken`, and the sanitized user object.

2. **Refresh token**
   ```
   POST /auth/refresh
   {
     "refreshToken": "<token from login>"
   }
   ```

3. **Logout**
   ```
   POST /auth/logout
   {
     "refreshToken": "<token from login>"
   }
   ```

### Admin – Create Users

Only admins can hit this endpoint; include the `Authorization: Bearer <accessToken>` header from the login response.

```
POST /users
Authorization: Bearer <accessToken>
{
  "email": "qa@example.com",
  "password": "Pass@1234",
  "role": "QA",
  "organization": "Quality Labs"
}
```

Response:

```
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "qa@example.com",
      "role": "QA",
      "organization": "Quality Labs"
    }
  }
}
```

### Exporter Batches + QA

Authenticated exporters (and admins) can manage their batches:

1. **List own batches**
   ```
   GET /batches
   Authorization: Bearer <accessToken>
   ```
2. **Create batch + upload attachments (PNG/JPG/PDF up to 5MB)**
   ```
   POST /batches
   Content-Type: multipart/form-data
   Fields: productType, variety, quantity, unit, originCountry, destinationCountry, harvestDate, notes
   Files: documents[]
   ```
   Response includes stored metadata plus `docs[].url` pointing to `/uploads/...`.
3. **View a single batch**
   ```
   GET /batches/:id
   ```
4. **Append more attachments**
   ```
   POST /batches/:id/documents
   Content-Type: multipart/form-data
   Files: documents[]
   ```

5. **Record QA inspection** (QA/Admin)
   ```
   POST /batches/:id/inspection
   {
     "moisturePercent": 9.8,
     "pesticidePPM": 0.02,
     "organicStatus": "India Organic",
     "isoCode": "ISO 22000",
     "result": "PASS",
     "notes": "Meets export spec"
   }
   ```

### Verifiable Credentials & Templates

1. `POST /vc/:batchId/issue` (QA/Admin) → Generates the Digital Product Passport (W3C VC + QR image), updates batch status to `CERTIFIED`, logs audit + verification URLs.
2. `GET /vc/:batchId` → Download VC JSON/metadata (Exporter/QA/Admin).
3. `POST /vc/:batchId/revoke` (Admin) → Mark credential revoked with optional reason.
4. `GET /vc/templates` (QA/Admin) → List configured VC templates.
5. `POST /vc/templates` (Admin) → Create template (`name`, `description`, `schemaUrl`, `fields[]`).

### Verification / Inji Verify simulation

- `GET /verify/:credentialId` (public) → Validates signature/expiry/revocation, returns summary + VC payload, logs activity.
- `POST /verify/upload` (public) → Accept VC JSON for offline verification (signature + expiry checks).
- `GET /verify/activity` (public) → Recent verification attempts (used by customs dashboard KPIs).

QA and Admin roles automatically see every batch when calling `GET /batches`, so QA screens can reuse the same endpoint later.

## Folder Structure

```
backend/
├─ data/          # runtime JSON stores (git ignored)
├─ src/
│  ├─ controllers
│  ├─ middleware
│  ├─ routes
│  ├─ services
│  └─ utils
├─ uploads/      # multer destination (git ignored)
└─ README.md
```

## Next Steps

- Swap JSON storage with PostgreSQL (Knex/Prisma) while keeping the controllers the same.
- Add password reset + change password endpoints.
- Hook this API to the React exporter/QA dashboards for login and inspection flows.

