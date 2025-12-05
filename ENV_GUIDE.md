# Environment Variables Guide

This document explains all environment variables used in the project.

## Backend Environment Variables

Location: `backend/.env`

### Required Variables

#### JWT_SECRET
- **Type:** String
- **Required:** Yes
- **Description:** Secret key used to sign and verify JWT tokens
- **Default (Dev):** `dev-secret`
- **Production:** Must be a strong, random string (min 32 characters)
- **Example:** `your_secure_jwt_secret_change_this_in_production`

**Generate a secure secret:**
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

```bash
# Linux/Mac
openssl rand -base64 32
```

#### PORT
- **Type:** Number
- **Required:** No
- **Description:** Port number for the backend server
- **Default:** `4000`
- **Example:** `4000`

### Current .env File

```env
JWT_SECRET=your_secure_jwt_secret_change_this_in_production
PORT=4000
```

---

## Frontend Environment Variables

Location: `frontend/.env` (not created yet, optional)

### Optional Variables

#### VITE_API_URL
- **Type:** String
- **Required:** No
- **Description:** Backend API base URL
- **Default:** `http://localhost:4000`
- **Production:** Your deployed backend URL
- **Example:** `https://api.yourdomain.com`

**Note:** Vite requires env vars to be prefixed with `VITE_` to be exposed to client code.

### Example frontend/.env

```env
VITE_API_URL=http://localhost:4000
```

**Usage in code:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
fetch(`${API_URL}/api/auth/login`, { ... });
```

---

## Environment-Specific Configurations

### Development Environment

**Backend (.env):**
```env
JWT_SECRET=dev-secret-key-change-in-production
PORT=4000
NODE_ENV=development
```

**Frontend (.env.local):**
```env
VITE_API_URL=http://localhost:4000
```

### Production Environment

**Backend (.env.production):**
```env
JWT_SECRET=<strong-random-32+-char-secret>
PORT=8080
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
OPENAI_API_KEY=sk-...
WHATSAPP_API_KEY=your-whatsapp-key
SENTRY_DSN=https://...
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://api.yourdomain.com
```

---

## Future Environment Variables

### Database (PostgreSQL)

```env
DATABASE_URL=postgresql://username:password@localhost:5432/tax_filing_db
DB_POOL_SIZE=10
```

### Redis (Session Storage)

```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

### AWS S3 (File Storage)

```env
AWS_S3_BUCKET=tax-filing-documents
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### OpenAI (AI Processing)

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
```

### WhatsApp Business API

```env
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
```

### Email Service (SendGrid/Mailgun)

```env
SENDGRID_API_KEY=SG.your-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### Monitoring & Logging

```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
LOG_LEVEL=info
```

### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Security Best Practices

### ✅ DO:

1. **Never commit .env files to git**
   - Always add `.env*` to `.gitignore`
   - Exceptions: `.env.example` (template without secrets)

2. **Use strong secrets**
   - Minimum 32 characters
   - Random alphanumeric + special chars
   - Different for each environment

3. **Rotate secrets regularly**
   - Change JWT secrets every 90 days
   - Update API keys when team members leave
   - Rotate database passwords quarterly

4. **Use environment-specific files**
   - `.env.development` for local dev
   - `.env.production` for production
   - `.env.test` for testing

5. **Store production secrets securely**
   - Use secret management tools (AWS Secrets Manager, HashiCorp Vault)
   - Use platform environment variables (Vercel, Railway, Render)
   - Never hardcode in source code

### ❌ DON'T:

1. **Don't use default secrets in production**
   - Change `dev-secret` to a strong random value
   
2. **Don't share .env files**
   - Use secure channels for secret sharing
   - Use secret management tools for teams

3. **Don't log environment variables**
   - Avoid `console.log(process.env)`
   - Sanitize logs before sending to external services

4. **Don't use same secrets across environments**
   - Dev, staging, and production should have different secrets

---

## Loading Environment Variables

### Backend (Node.js)

**Using dotenv:**
```typescript
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET;
const port = process.env.PORT || 4000;
```

**With different env files:**
```typescript
// Load .env.production
dotenv.config({ path: '.env.production' });
```

### Frontend (Vite)

**Access env vars:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const mode = import.meta.env.MODE; // development or production
```

**Type definitions:**
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Environment Variables Template

### .env.example (Backend)

Create this file to share with team (no secrets):

```env
# JWT Configuration
JWT_SECRET=your-secret-here

# Server Configuration
PORT=4000
NODE_ENV=development

# Database (Future)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis (Future)
REDIS_URL=redis://localhost:6379

# AWS S3 (Future)
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key

# OpenAI (Future)
OPENAI_API_KEY=sk-your-key

# WhatsApp (Future)
WHATSAPP_ACCESS_TOKEN=your-token
```

---

## Platform-Specific Configuration

### Vercel (Frontend)

Add in Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://api.yourdomain.com
```

### Railway (Backend)

Add in Railway dashboard → Variables:

```
JWT_SECRET=your-production-secret
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=${{PORT}}
```

### Render (Backend)

Add in Render dashboard → Environment:

```
JWT_SECRET=your-production-secret
DATABASE_URL=${{DATABASE_URL}}
```

---

## Troubleshooting

### Environment variables not loading

1. **Check .env file location**
   - Must be in project root (same level as src/)
   - Check filename exactly: `.env` (not `env.txt`)

2. **Check dotenv import**
   - Must call `dotenv.config()` before using variables
   - Import at the top of entry file

3. **Check variable names**
   - Backend: `process.env.VAR_NAME`
   - Frontend (Vite): Must start with `VITE_`

4. **Restart development server**
   - Changes to .env require server restart
   - In Vite, .env changes need dev server restart

### Undefined environment variables

```typescript
// Add fallback values
const secret = process.env.JWT_SECRET || 'fallback-dev-secret';
const port = Number(process.env.PORT) || 4000;
```

### Type errors with env vars

```typescript
// All process.env values are string | undefined
const port = Number(process.env.PORT || '4000');
const maxSize = parseInt(process.env.MAX_SIZE || '10485760');
```

---

## Validation

### Validate required env vars on startup:

```typescript
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

console.log('✅ All required environment variables are set');
```

---

## Documentation

Keep this updated as you add new environment variables to the project.

**Last Updated:** December 2025
