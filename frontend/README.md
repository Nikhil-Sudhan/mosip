# AgriQCert Frontend

React + Vite portal for Milestone 2 (Exporter batch submission). It implements:

- JWT login against the Node backend
- Exporter dashboard with stats + recent batches
- “Submit batch” form with file uploads (images/PDFs)
- React Query data layer + Zustand auth store
- Tailwind CSS theming

## Setup

```bash
cd frontend
npm install          # installs dev deps as well (thanks to .npmrc)
cp .env.example .env # optional, defaults to localhost backend
npm run dev
```

The dev server runs on `http://localhost:5173` and talks to the backend via `VITE_API_BASE_URL`.

## Scripts

- `npm run dev` – start Vite dev server.
- `npm run build` – compile production bundle (shows a warning on Node 20.17, upgrade to 20.19+ when possible).
- `npm run preview` – preview the built app.

## Login & Registration

### Agency Login (Admin/QA/Customs)
- Email: `admin@gmail.com`
- Password: `admin`

### Importers & Exporters
- **Registration**: Click "Create one here" link on the login page
- **Login**: Use registered credentials

### Legacy Admin (if needed)
- Email: `admin@agriqcert.test`
- Password: `Admin@123`

Once logged in as Admin you can create additional users via the admin dashboard.

## Feature Walkthrough

1. **Login page (`/login`)**
   - **Dual Login System**: Choose between "Agency Login" or "Importers & Exporters Login"
   - Agency login auto-fills with default credentials
   - Importers/Exporters can register new accounts
   - Uses `react-hook-form` + `zod`.
   - Redirects to the correct dashboard based on `user.role`.

2. **Registration page (`/register`)**
   - Available for Importers and Exporters only
   - Requires email, password (min 8 chars), organization name, and account type
   - Automatically logs in after successful registration

3. **Exporter dashboard (`/exporter`)**
   - Fetches batches with React Query, shows KPI cards and a recent table.
   - "Submit new batch" button links to the form screen.
   - View credentials for certified batches.

4. **Batch submission (`/exporter/new`)**
   - Captures product info, harvest date, notes, and attachments.
   - Sends `FormData` to `POST /api/batches` (multer stores files on the backend).
   - Toast messages notify success/failure and refresh the list automatically.

5. **Admin/QA Dashboard (`/admin`)**
   - View all batches with status tracking
   - Record QA inspections (PASS/FAIL)
   - Issue credentials only for inspected batches that passed
   - Rejected batches cannot receive credentials
   - Track batch lifecycle: SUBMITTED → INSPECTED/REJECTED → CERTIFIED

## Role Dashboards

- **Admin & QA (`/admin`)** – Monitor every exporter batch, record QA inspections, and issue credentials. 
  - **Batch Workflow**: SUBMITTED → Record Inspection (PASS/FAIL) → INSPECTED/REJECTED → Issue Credential (only if PASS) → CERTIFIED
  - Only batches with `INSPECTED` status and `PASS` result can receive credentials
  - Rejected batches are permanently blocked from credential issuance
  - Stats show: Total batches, Awaiting QA, Inspected (Ready), Certificates issued, Rejected

- **Exporter (`/exporter`)** – See personal KPIs, recent batches, and start new submissions. Exporters cannot issue credentials but can view their issued credentials.

- **Customs/Importer (`/customs`)** – Verify Digital Product Passports using the ID or QR code and review recent verification activity.

**Profile & Logout**: All dashboards include a profile icon in the header with user email and logout functionality.

Login redirects are automatic based on `user.role`. Importers and Exporters can register directly, while Agency users (Admin/QA/Customs) must be created by admins.

## Folder Structure

```
src/
├─ api/            # axios client + REST helpers
├─ components/     # buttons, forms, tables, layouts
├─ pages/
│  ├─ Login.jsx
│  └─ exporter/
├─ store/          # zustand auth store with localStorage persistence
├─ App.jsx         # Router + protected routes
└─ main.jsx        # Providers (Router, React Query)
```

## Next Steps

- Add QA dashboard + verification portal from the design doc.
- Hook up real status transitions once QA endpoints land.
- Add localization toggle + accessibility polish.
