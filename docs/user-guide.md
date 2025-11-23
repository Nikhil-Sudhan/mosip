## User Guide

### 1. Admin / QA

1. **Sign in** using the seeded admin account (`admin@agriqcert.test / Admin@123`).
2. **Invite users** from the “Invite new portal user” card:
   - Choose role (Exporter / QA / Customs / Importer / Admin).
   - Share credentials securely with the partner.
3. **Monitor batches** in the “Latest batches” table:
   - Click **Record QA** to capture inspection values (moisture %, pesticide PPM, organic status, ISO code, notes).
   - After inspection status is `INSPECTED`, click **Generate VC** to issue the Digital Product Passport.
4. **View or revoke credentials**:
   - `View VC` opens a modal with JSON preview, QR image, and download buttons.
   - Use the API (`POST /api/vc/:batchId/revoke`) if you need to revoke (UI button can be added easily).
5. **Manage templates** on the right panel:
   - Update template metadata (name, description, schema URL, field list). Stored under `src/data/templates.json`.

### 2. Exporter

1. Log in with your exporter credentials.
2. Dashboard shows KPIs and latest batches.
3. Click **Submit new batch**:
   - Fill product data, harvest date, route, and notes.
   - Upload lab reports / packaging images (PNG/JPG/WEBP/PDF up to 5 files).
4. Track progress:
   - Each batch has a **Track** button → timeline modal with lifecycle updates (`SUBMITTED → INSPECTED → CERTIFIED`).
   - Once QA issues VC, click **View VC** to download JSON or QR for packaging.

### 3. QA Agency

1. Login with QA credentials (same dashboard as Admin for now).
2. Check the batch list:
   - Click **Record QA** to open the inspection modal.
   - Enter measured metrics and PASS/FAIL decision.
3. After inspection, click **Generate VC** to issue the Digital Product Passport.
4. Share the QR/JSON with the exporter or print it for shipment documents.

### 4. Customs / Importer (logged in)

1. Login with CUSTOMS role to access `/customs`.
2. Options:
   - Paste credential ID (from paperwork) and hit **Check credential**.
   - Click **Scan QR** to open the camera (mobile/desktop) and scan packaging codes.
3. The verification card shows verdict + inspection highlights. Activity table tracks recent checks (with verdict + timestamp).

### 5. Public Inji Verify Portal

Accessible at `/verify` without login.

1. **Scan QR** (camera) or paste the verification link; the form auto-extracts the credential ID.
2. **Upload JSON** – drag/drop the DPP exported from Inji Wallet for offline verification.
3. Result panel displays issuer, route, validity checks (signature/expiry/revocation), and inspection metrics.
4. Users can download the parsed DPP JSON for archiving.

### 6. Sample Credential

`docs/sample-dpp.json` contains a ready-to-share Digital Product Passport generated from the API. Import it into the Verify portal via the upload option or scan its QR (see `frontend` admin modal).

### 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails | Ensure backend running on `http://localhost:4000`. Check console for CORS hints. |
| File upload blocked | Allowed types: PNG/JPG/WEBP/PDF, max 5MB. Compress before uploading. |
| QR scanner not opening | Browser might block camera access. Allow permissions or use manual ID input. |
| Verification says `NOT_FOUND` | Ensure QA issued the VC and share the correct QR/ID. Revoked credentials appear as `REVOKED`. |

### 8. Extending

- Replace JSON stores with PostgreSQL (see `AgriQCertDesign.md` for schema).
- Connect MOSIP eSignet for SSO and Inji Certify for real signatures.
- Add more roles/dashboards (audit viewer, template editor) by following the existing API contracts.




