# 🚀 Quick Setup Guide

## The Problem
Your app crashed because it needs **PostgreSQL database** to run.

## ✅ Solution: Install PostgreSQL

### Windows (Easiest)

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the installer
   - Run the installer

2. **During installation:**
   - Remember the password you set for the `postgres` user (you'll need it!)
   - Keep default port: `5432`
   - Keep default installation folder

3. **After installation, create the database:**
   - Open **pgAdmin** (comes with PostgreSQL) OR
   - Open **Command Prompt** and run:
   ```bash
   psql -U postgres
   ```
   - Enter your password when asked
   - Then run:
   ```sql
   CREATE DATABASE agriqcert;
   ```
   - Type `\q` to exit

4. **Create `.env` file in `backend` folder:**
   ```bash
   cd backend
   ```
   Create a file named `.env` with this content:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/agriqcert
   PORT=4000
   JWT_ACCESS_SECRET=dev-access-secret-change-in-production
   JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
   ```
   **Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation!**

5. **Start the app:**
   ```bash
   npm run dev
   ```

---

### Alternative: Use Docker (No PostgreSQL Installation Needed!)

If you don't want to install PostgreSQL, use Docker which includes everything:

1. **Install Docker Desktop:** https://www.docker.com/products/docker-desktop/

2. **Run:**
   ```bash
   docker-compose up --build
   ```

This will start both the database and the app automatically!

---

## 🆘 Still Having Issues?

**Error: "Cannot connect to PostgreSQL"**
- Make sure PostgreSQL is running (check Windows Services)
- Check your password in the `.env` file
- Make sure the database `agriqcert` exists

**Error: "Database does not exist"**
- Run: `CREATE DATABASE agriqcert;` in psql

**Need help?** Check the error message - it should tell you exactly what's wrong!



