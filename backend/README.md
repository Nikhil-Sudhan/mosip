# AgriQCert Backend

Node.js API powered by Express, JSON Web Tokens, and PostgreSQL (Supabase).

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase account and project

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Configure Supabase Database:
   - Create a `.env` file in the `backend` directory
   - Get your Supabase connection string from: **Supabase Dashboard > Settings > Database > Connection string**
   - Add these lines to your `.env` file:
     ```
     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
     DATABASE_SSL=true
     ```
   - Replace `[YOUR-PASSWORD]` with your database password
   - Replace `[YOUR-PROJECT-REF]` with your Supabase project reference

3. Start the dev server:
   ```bash
   npm run dev
   ```

When the server boots, it automatically creates all required database tables in your Supabase database:

- `users` – user accounts with hashed passwords
- `sessions` – refresh token store
- `batches` – exporter batch submissions
- `qa_agencies` – QA agency profiles
- `inspections` – inspection records
- `credentials` – verifiable credentials
- And more...

Uploaded documents are saved to `backend/uploads/` (git ignored) and exposed via `/uploads/<filename>`.

The first run also seeds a default admin:

- Email: `admin@agriqcert.test`
- Password: `Admin@123`

**New Default Agency Admin**:
- Email: `admin@gmail.com`
- Password: `admin`

Change these passwords immediately after logging in by creating new admin users, then disabling the default ones (future milestone).

## Available Endpoints

Base URL: `http://localhost:4000/api`

### Health

- `GET /health` → `{ "success": true, "data": { "status": "ok" } }`

### Auth

1. **Login**
   ```
   POST /auth/login
   {
     "email": "admin@gmail.com",
     "password": "admin"
   }
   ```
   Response returns `accessToken`, `refreshToken`, and the sanitized user object.

2. **Register** (Public - Importers/Exporters only)
   ```
   POST /auth/create-account
   {
     "email": "exporter@example.com",
     "password": "SecurePass123",
     "role": "EXPORTER",  // or "IMPORTER"
     "organization": "Farm Co."
   }
   ```
   Response returns `accessToken`, `refreshToken`, and the new user object. Password must be at least 8 characters.

3. **Refresh token**
   ```
   POST /auth/refresh
   {
     "refreshToken": "<token from login>"
   }
   ```

4. **Logout**
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
     "result": "PASS",  // or "FAIL"
     "notes": "Meets export spec"
   }
   ```
   **Status Updates**:
   - `result: "PASS"` → Batch status becomes `INSPECTED` (ready for credential)
   - `result: "FAIL"` → Batch status becomes `REJECTED` (cannot receive credential)

### Verifiable Credentials & Templates

1. `POST /vc/:batchId/issue` (QA/Admin) → Generates the Digital Product Passport (W3C VC + QR image), updates batch status to `CERTIFIED`, logs audit + verification URLs.
   
   **Validation Rules**:
   - Batch must have status `INSPECTED`
   - Inspection result must be `PASS`
   - Batch cannot be `REJECTED`
   - Credential cannot already be issued for this batch
   
   **Error Responses**:
   - `400 BATCH_NOT_INSPECTED` - Batch must be inspected before credential issuance
   - `400 INSPECTION_NOT_PASSED` - Batch inspection must pass
   - `400 BATCH_REJECTED` - Cannot issue credential for rejected batch
   - `400 CREDENTIAL_ALREADY_ISSUED` - Credential already exists for this batch

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

