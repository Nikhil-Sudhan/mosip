# Supabase Setup Guide

This guide will help you configure your backend to use Supabase as the database.

## Step 1: Get Your Supabase Connection String

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string**
5. Select **URI** format
6. Copy the connection string (it looks like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

## Step 2: Create .env File

1. In the `backend` directory, create a new file named `.env`
2. Add the following content (replace with your actual Supabase connection string):

```env
# Supabase Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
DATABASE_SSL=true

# Server Configuration
PORT=4000
PUBLIC_URL=http://localhost:4000
VERIFY_PORTAL_URL=http://localhost:4173/verify

# JWT Configuration
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# Default Admin User
DEFAULT_ADMIN_EMAIL=admin@agriqcert.test
DEFAULT_ADMIN_PASSWORD=Admin@123
```

**Important**: Replace `[YOUR-PASSWORD]` and `[YOUR-PROJECT-REF]` with your actual Supabase values!

## Step 3: Start the Server

Run the backend server:

```bash
cd backend
npm run dev
```

## Step 4: Verify Connection

When the server starts, you should see:
- `Connected to PostgreSQL database` - This means you're connected!
- `Database schema initialized successfully` - This means all tables were created

If you see errors, check:
1. Your `.env` file exists in the `backend` directory
2. The `DATABASE_URL` is correct (copy-paste from Supabase)
3. The `DATABASE_SSL=true` is set
4. Your Supabase project is active

## Troubleshooting

**Error: Cannot connect to PostgreSQL database**
- Double-check your connection string in `.env`
- Make sure `DATABASE_SSL=true` is set
- Verify your Supabase project is running

**Error: SSL connection required**
- Make sure `DATABASE_SSL=true` is in your `.env` file

## Using Docker Compose

If you're using Docker Compose, the `docker-compose.yml` file will automatically read your `.env` file. Make sure your `.env` file is in the `backend` directory.

