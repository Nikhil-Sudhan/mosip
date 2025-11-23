## REST API Reference

Base URL: `http://localhost:4000/api`

### Auth

| Method | Endpoint        | Description                         |
|--------|-----------------|-------------------------------------|
| POST   | `/auth/login`   | Email/password → JWT tokens         |
| POST   | `/auth/refresh` | Refresh token → new access/refresh  |
| POST   | `/auth/logout`  | Revoke refresh token                |

**Login request**

```json
POST /auth/login
{
  "email": "admin@agriqcert.test",
  "password": "Admin@123"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "role": "ADMIN" },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Users (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create EXPORTER/QA/CUSTOMS/IMPORTER/ADMIN |

Payload:

```json
{
  "email": "qa@example.com",
  "password": "Pass@1234",
  "role": "QA",
  "organization": "Quality Labs"
}
```

### Batches

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/batches` | Exporter/QA/Admin | List batches (exporters filtered to own) |
| GET | `/batches/:id` | Authenticated | Batch details |
| POST | `/batches` | Exporter/Admin | Create batch (multipart with `documents[]`) |
| POST | `/batches/:id/documents` | Exporter/Admin | Append attachments |
| POST | `/batches/:id/inspection` | QA/Admin | Record inspection readings (moisture, pesticide, ISO, notes) |

Inspection payload:

```json
{
  "moisturePercent": 10.8,
  "pesticidePPM": 0.02,
  "organicStatus": "India Organic",
  "isoCode": "ISO 22000",
  "result": "PASS",
  "notes": "Meets export criteria"
}
```

### Verifiable Credentials

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/vc/:batchId/issue` | QA/Admin | Generate VC + QR |
| GET | `/vc/:batchId` | Exporter/QA/Admin | Download VC JSON (Digital Product Passport) |
| POST | `/vc/:batchId/revoke` | Admin | Revoke credential |
| GET | `/vc/templates` | QA/Admin | List VC templates |
| POST | `/vc/templates` | Admin | Create template |

**Issue response snippet**

```json
{
  "success": true,
  "data": {
    "credential": {
      "id": "f5c9a1f0-...",
      "batchId": "...",
      "status": "ACTIVE",
      "qrUrl": "http://localhost:4000/api/verify/f5c9a1",
      "qrImage": "data:image/png;base64,...",
      "credentialJson": {
        "@context": ["https://www.w3.org/2018/credentials/v1", "..."],
        "type": ["VerifiableCredential", "DigitalProductPassport"],
        "issuer": "did:example:qa-agency",
        "credentialSubject": { "...": "..." },
        "proof": { "jws": "..." }
      }
    }
  }
}
```

### Verification / Inji Verify simulation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verify/:credentialId` | Public | Online verification using stored credential |
| POST | `/verify/upload` | Public | Offline verification by uploading VC JSON |
| GET | `/verify/activity` | Public | Recent verification attempts (for dashboards) |

Sample verification result:

```json
{
  "success": true,
  "data": {
    "verdict": "VALID",
    "checks": {
      "signature": true,
      "expiry": true,
      "revocation": true
    },
    "summary": {
      "issuer": "did:example:quality-labs",
      "credentialId": "f5c9a1f0-...",
      "productName": "Turmeric",
      "route": "India → Netherlands",
      "issuedAt": "2025-11-17T09:00:00.000Z",
      "expiresAt": "2026-11-17T09:00:00.000Z"
    },
    "credential": { "...full VC JSON..." }
  }
}
```

`/verify/upload` expects body:

```json
{
  "credential": { ...W3C VC JSON... }
}
```

### Error format

```
HTTP 400/401/403/404
{
  "success": false,
  "error": {
    "code": "BATCH_NOT_FOUND",
    "message": "Batch not found or inaccessible"
  }
}
```

### Postman / Swagger

- Import `docs/api.md` table or generate automatically with e.g. VS Code Thunder Client.
- For hackathon demos: configure Postman collection hitting `http://localhost:4000/api`.




