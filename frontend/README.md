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

## Default Login

Use the backend’s seeded admin or create an exporter user via `POST /api/users`. Quick demo credentials:

- Email: `admin@agriqcert.test`
- Password: `Admin@123`

Once logged in as Admin you can create exporter accounts and sign in as them to view the exporter-only view.

## Feature Walkthrough

1. **Login page (`/login`)**
   - Uses `react-hook-form` + `zod`.
   - Redirects to the correct dashboard based on `user.role`.
2. **Exporter dashboard (`/exporter`)**
   - Fetches batches with React Query, shows KPI cards and a recent table.
   - “Submit new batch” button links to the form screen.
3. **Batch submission (`/exporter/new`)**
   - Captures product info, harvest date, notes, and attachments.
   - Sends `FormData` to `POST /api/batches` (multer stores files on the backend).
   - Toast messages notify success/failure and refresh the list automatically.

## Role Dashboards

- **Admin & QA (`/admin`)** – Monitor every exporter batch, issue credentials, and follow the operational playbook. QA users reuse this screen until a dedicated module is built.
- **Exporter (`/exporter`)** – See personal KPIs, recent batches, and start new submissions. Exporters cannot issue credentials.
- **Customs (`/customs`)** – Verify Digital Product Passports using the ID or QR code and review recent verification activity. The current view simulates the `/api/verify/:credentialId` call until that backend endpoint lands.

Login redirects are automatic based on `user.role`. To invite Customs officers, call `POST /api/users` with `"role": "CUSTOMS"`.

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
