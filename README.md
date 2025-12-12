<div align="center">

# AgriQCert Portal

**Agricultural Quality Certification & Digital Product Passport System**

A web portal for exporters to submit batches, QA partners to inspect and issue Verifiable Credentials, and importers/customs to verify credentials via QR code or JSON upload.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://

https://github.com/user-attachments/assets/94490aba-24c3-48e3-83c9-c9f0f26aa965

img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

</div>

---

## 🎥 Demo Video

<div align="center">

<video width="800" controls>
  <source src="demo video.mp4" type="video/mp4">
  Your browser does not support the video tag. [Download the video](demo%20video.mp4)
</video>

</div>

---

## ✨ Features

- **Role-Based Access**: Separate dashboards for Exporters, QA Agencies, Admins, and Customs/Importers
- **Batch Workflow**: Submit → QA Assignment → Inspection → Certification with full audit trail
- **QA Inspection**: Record moisture, pesticide levels, organic status, ISO certifications
- **Digital Product Passports**: W3C-compliant Verifiable Credentials with QR codes
- **Verification Portal**: Public QR scanning and JSON upload for credential verification
- **Inji Integration**: Production-ready VC issuance (Inji Certify) with wallet sharing (Inji Wallet)
- **Fallback Mode**: Works without external services for development/testing

---

## 🏗️ Architecture

```
React Frontend (Port 5173) ←→ Express Backend (Port 4000) ←→ PostgreSQL
                                         ↓
                                  Inji Services
                                  (Certify/Wallet/Verify)
```

**Tech Stack**: React 19 + Vite, Express 5, PostgreSQL, Tailwind CSS, Zustand, React Query, JWT Auth

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

Access at:
- **Frontend**: http://localhost:4173
- **Backend**: http://localhost:4000

### Option 2: Local Development

**Prerequisites**: Node.js 20+, PostgreSQL database

```bash
# Backend
cd backend
npm install
# Create .env file (see Configuration below)
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

---

## ⚙️ Configuration

Create `.env` in `backend/`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_SSL=true  # Required for Supabase/cloud databases

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Default Admin (CHANGE IN PRODUCTION!)
DEFAULT_ADMIN_EMAIL=admin@agriqcert.test
DEFAULT_ADMIN_PASSWORD=Admin@123

# Inji Services (Optional - for production VC issuance)
INJI_CERTIFY_BASE_URL=https://certify.inji.io
INJI_CERTIFY_API_KEY=your-api-key
INJI_ISSUER_DID=did:mosip:your-issuer-id
INJI_WALLET_BASE_URL=https://wallet.inji.io
INJI_WALLET_API_KEY=your-api-key
INJI_VERIFY_BASE_URL=https://verify.inji.io
INJI_VERIFY_API_KEY=your-api-key
```

Frontend: Create `.env` in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 📁 Project Structure

```
mosip/
├── backend/          # Express API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, error handling
│   │   └── db/            # PostgreSQL schema
│   └── .env
├── frontend/         # React app
│   ├── src/
│   │   ├── pages/         # Dashboard pages
│   │   ├── components/    # UI components
│   │   └── api/           # API client
│   └── .env
└── docker-compose.yml
```

---

## 🔄 Workflow

1. **Exporter** submits batch with documents → Status: `SUBMITTED`
2. **System** auto-assigns to QA agency → Status: `QA_ASSIGNED`
3. **QA Agency** schedules and performs inspection → Status: `INSPECTED` (PASS) or `REJECTED` (FAIL)
4. **QA/Admin** issues Verifiable Credential → Status: `CERTIFIED`
5. **Public** verifies credential via QR scan or JSON upload

---

## 🔐 Authentication

- **Roles**: `ADMIN`, `QA`, `EXPORTER`, `IMPORTER`, `CUSTOMS`
- **JWT**: Access tokens (15min) + Refresh tokens (7 days, stored in DB)
- **Default Admin**: `admin@agriqcert.test` / `Admin@123` ⚠️ Change in production!

---

## 🎫 Verifiable Credentials

**Production Mode** (Inji Certify):
- Real cryptographic signatures
- Automatic wallet sharing
- Verification via Inji Verify API

**Fallback Mode** (Development):
- Works without external services
- Deterministic signature simulation
- Valid W3C VC structure

---

## 🔌 API Endpoints

- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`
- **Batches**: `/api/batches` (GET, POST), `/api/batches/:id`
- **QA**: `/api/qa/batches`, `/api/qa/batches/:id/inspect`
- **Credentials**: `/api/vc/issue`, `/api/vc/:id/qr`
- **Verification**: `/api/verify` (public, no auth)

---

## 🚢 Production Checklist

- [ ] Change JWT secrets and default admin credentials
- [ ] Configure production PostgreSQL with SSL
- [ ] Set up Inji service URLs and API keys
- [ ] Enable HTTPS (NGINX/reverse proxy)
- [ ] Configure secure file storage
- [ ] Set up monitoring and backups

---

## 🔧 Troubleshooting

**Backend won't start?**
- Check port 4000 is available
- Verify database connection in `.env`
- Ensure `npm install` completed

**Frontend won't start?**
- Check port 5173 is available
- Ensure backend is running
- Verify `VITE_API_BASE_URL` in `.env`

**Database connection errors?**
- Verify `DATABASE_URL` is correct
- Set `DATABASE_SSL=true` for Supabase/cloud
- Check network connectivity

**Can't login?**
- Try default admin: `admin@agriqcert.test` / `Admin@123`
- Check both backend and frontend are running
- Verify JWT secrets in `.env`

---

## 📝 Default Credentials

**Agency Login** (Admin/QA/Customs):
- Email: `admin@agriqcert.test`
- Password: `Admin@123`

**Importers & Exporters**: Register via "Create one here" on login page

---

<div align="center">

**Built with ❤️ for Agricultural Quality Certification**

</div>
