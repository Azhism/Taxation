# PostgreSQL Database Setup Guide

## Prerequisites

- PostgreSQL installed on your local machine
- pgAdmin or command-line access to PostgreSQL

## Step 1: Create Database

### Option A: Using pgAdmin (GUI)

1. Open pgAdmin
2. Connect to your PostgreSQL server (usually `localhost`)
3. Right-click on "Databases" → Create → Database
4. Name: `tax_filing_db`
5. Owner: `postgres` (or your username)
6. Click "Save"

### Option B: Using Command Line (psql)

```powershell
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE tax_filing_db;

# Connect to the new database
\c tax_filing_db

# Exit
\q
```

## Step 2: Run Database Schema

### Option A: Using pgAdmin

1. In pgAdmin, select `tax_filing_db` database
2. Click "Tools" → "Query Tool"
3. Open the file: `d:\Side-Hustle\backend\database\schema.sql`
4. Copy all the contents
5. Paste into Query Tool
6. Click "Execute" (F5)
7. Verify tables created: Check "Schemas" → "public" → "Tables"

### Option B: Using Command Line

```powershell
# Navigate to backend directory
cd d:\Side-Hustle\backend

# Run the schema file
psql -U postgres -d tax_filing_db -f database\schema.sql
```

### Verify Tables Created

```sql
-- Connect to database
psql -U postgres -d tax_filing_db

-- List all tables
\dt

-- You should see:
-- - users
-- - documents
-- - tax_forms
-- - sessions
```

## Step 3: Configure Connection

Update `backend\.env` with your PostgreSQL credentials:

```env
# Replace 'your_password' with your actual PostgreSQL password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/tax_filing_db
```

### Find Your PostgreSQL Password

If you forgot your password:

1. **Windows:** Password set during PostgreSQL installation
2. **Check pgAdmin:** Connection should be saved
3. **Reset password:**
   ```powershell
   psql -U postgres
   ALTER USER postgres PASSWORD 'new_password';
   ```

## Step 4: Install Dependencies

```powershell
cd d:\Side-Hustle\backend
npm install
```

This will install the `pg` (node-postgres) package.

## Step 5: Test Connection

Start the backend:

```powershell
npm run dev
```

You should see:
```
✓ Connected to PostgreSQL database
🚀 API running on http://localhost:4000
```

If you see connection errors, check:
1. PostgreSQL service is running
2. Database `tax_filing_db` exists
3. Credentials in `.env` are correct
4. Port 5432 is not blocked

## Database Structure

### Tables Created

1. **users** - User accounts
   - `id` (SERIAL PRIMARY KEY)
   - `email` (VARCHAR UNIQUE)
   - `name` (VARCHAR)
   - `password_hash` (VARCHAR)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **documents** - Uploaded files metadata
   - `id` (SERIAL PRIMARY KEY)
   - `user_id` (INTEGER → users.id)
   - `filename` (VARCHAR) - Stored filename
   - `original_name` (VARCHAR) - Original upload name
   - `file_url` (VARCHAR) - Access URL
   - `file_type` (VARCHAR) - MIME type
   - `file_size` (INTEGER) - Bytes
   - `upload_date` (TIMESTAMP)
   - `status` (VARCHAR) - 'uploaded', 'processing', etc.

3. **tax_forms** - Tax filing records (future use)
   - `id` (SERIAL PRIMARY KEY)
   - `user_id` (INTEGER → users.id)
   - `document_id` (INTEGER → documents.id)
   - `tax_year` (INTEGER)
   - `form_data` (JSONB)
   - `gross_income`, `tax_deductions`, `tax_liability` (NUMERIC)
   - `status` (VARCHAR)
   - `created_at`, `submitted_at` (TIMESTAMP)

4. **sessions** - Session management (future use)

## Useful PostgreSQL Commands

### View Data

```sql
-- Connect to database
psql -U postgres -d tax_filing_db

-- View all users
SELECT * FROM users;

-- View all documents
SELECT * FROM documents;

-- View documents with user info
SELECT u.email, d.original_name, d.upload_date 
FROM users u 
JOIN documents d ON u.id = d.user_id
ORDER BY d.upload_date DESC;

-- Count documents per user
SELECT u.email, COUNT(d.id) as doc_count
FROM users u
LEFT JOIN documents d ON u.id = d.user_id
GROUP BY u.email;
```

### Manage Data

```sql
-- Delete a user (and all their documents due to CASCADE)
DELETE FROM users WHERE email = 'test@example.com';

-- Delete all documents for a user
DELETE FROM documents WHERE user_id = 1;

-- Update document status
UPDATE documents SET status = 'processed' WHERE id = 1;

-- Reset database (careful!)
TRUNCATE users, documents, tax_forms, sessions RESTART IDENTITY CASCADE;
```

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Check if PostgreSQL is running:
   ```powershell
   # Windows - check services
   Get-Service -Name postgresql*
   
   # Start if stopped
   Start-Service postgresql-x64-14  # Adjust version number
   ```

2. Verify PostgreSQL is listening on port 5432:
   ```powershell
   netstat -ano | findstr :5432
   ```

### Authentication Failed

```
Error: password authentication failed for user "postgres"
```

**Solution:**
1. Verify password in `.env` file
2. Try connecting with pgAdmin to verify credentials
3. Reset password if needed:
   ```sql
   ALTER USER postgres PASSWORD 'new_password';
   ```

### Database Does Not Exist

```
Error: database "tax_filing_db" does not exist
```

**Solution:**
1. Create the database using pgAdmin or psql
2. Run the schema.sql file

### Table Already Exists

```
ERROR: relation "users" already exists
```

**Solution:**
This is normal if you run schema.sql multiple times. The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe.

### Permission Denied

```
ERROR: permission denied for schema public
```

**Solution:**
Grant permissions to your user:
```sql
GRANT ALL ON SCHEMA public TO postgres;
```

## Migration from In-Memory to Database

Your existing code has been updated:

1. ✅ User signup now saves to `users` table
2. ✅ User login queries `users` table
3. ✅ Document upload saves metadata to `documents` table
4. ✅ New endpoint: `GET /api/docs` - Get user's documents

### What Changed

**Before (In-Memory):**
```typescript
const users: Record<string, any> = {};
users[email] = { email, name, passwordHash };
```

**After (PostgreSQL):**
```typescript
await query(
  "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)",
  [email, name, hash]
);
```

## New API Endpoint

### GET /api/docs
Get all documents for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "filename": "1764844652755-Bcom_Final.pdf",
      "original_name": "Bcom Final.pdf",
      "file_url": "/uploads/1764844652755-Bcom_Final.pdf",
      "file_type": "application/pdf",
      "file_size": 1024567,
      "upload_date": "2025-12-04T10:30:52.755Z",
      "status": "uploaded"
    }
  ]
}
```

## Backup & Restore

### Backup Database

```powershell
# Full database backup
pg_dump -U postgres tax_filing_db > backup.sql

# Backup with timestamp
$date = Get-Date -Format "yyyy-MM-dd_HHmmss"
pg_dump -U postgres tax_filing_db > "backup_$date.sql"
```

### Restore Database

```powershell
# Restore from backup
psql -U postgres tax_filing_db < backup.sql
```

## Next Steps

1. ✅ Database is set up and connected
2. ✅ Backend uses PostgreSQL for all operations
3. 🔄 Update frontend to show user's document list
4. 🔄 Add document management features (delete, view)
5. 🔄 Implement AI extraction for tax forms

---

**You're now running with PostgreSQL! 🎉**

Your data persists across server restarts, and you have a production-ready database setup.
