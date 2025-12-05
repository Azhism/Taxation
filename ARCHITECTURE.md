# System Architecture

## Overview

This document describes the architecture of the AI-powered tax filing platform for Pakistan.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Web Browser  │  │WhatsApp (v2) │  │ Mobile (v3)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ HTTP/REST        │ WebHook          │ REST API
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼─────────────┐
│                      Frontend Layer                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │         React App (Vite + TypeScript)              │     │
│  │  ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐         │     │
│  │  │Landing│ │Signup│ │Dashboard│ │ Upload │         │     │
│  │  └──────┘ └──────┘ └────────┘ └────────┘         │     │
│  │         Port 3000 (Development)                    │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API Calls
                           │ (JWT Authentication)
┌──────────────────────────▼───────────────────────────────────┐
│                      Backend Layer                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │     Express.js Server (TypeScript + Node.js)       │     │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  │     │
│  │  │   Auth API  │  │  Upload API  │  │ AI (v2)  │  │     │
│  │  │ /auth/*     │  │ /docs/*      │  │ /ai/*    │  │     │
│  │  └─────────────┘  └──────────────┘  └──────────┘  │     │
│  │         Port 4000 (Development)                    │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────┬───────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌───────▼────────┐ ┌──────▼──────┐
│  File Storage  │ │   Database     │ │   AI/ML     │
│  (Local/S3)    │ │  (Postgres)    │ │  (OpenAI)   │
│                │ │                │ │             │
│  Current: Local│ │  Future: v2    │ │  Future: v2 │
│  ./uploads/    │ │                │ │             │
└────────────────┘ └────────────────┘ └─────────────┘
```

## Component Details

### Frontend (React + Vite)

**Technology:** React 18, TypeScript, Vite, React Router DOM

**Pages:**
- `Landing.tsx` - Marketing page with product info
- `Signup.tsx` - User registration
- `Login.tsx` - User authentication  
- `Dashboard.tsx` - User home page after login
- `UploadPage.tsx` - Document upload interface

**State Management:**
- localStorage for JWT token
- localStorage for user info (email, name)
- React useState for component state

**Routing:**
- Client-side routing with React Router
- Protected routes check for JWT token

**API Communication:**
- Fetch API for HTTP requests
- JWT sent in `Authorization: Bearer <token>` header

### Backend (Express + TypeScript)

**Technology:** Node.js, Express, TypeScript, JWT, Multer, bcryptjs

**Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | No | Create new user |
| POST | /api/auth/login | No | Login user, get JWT |
| POST | /api/docs/upload | Yes | Upload document |
| GET | /api/health | No | Health check |
| GET | /uploads/:filename | No | Serve uploaded files |

**Middleware:**
- `cors()` - Cross-origin requests
- `express.json()` - Parse JSON bodies
- `authMiddleware()` - JWT verification
- `multer()` - File upload handling

**Security:**
- JWT tokens (24h expiry)
- bcryptjs password hashing (10 rounds)
- File type validation (PDF, PNG, JPG only)
- File size limit (10MB max)

### Data Storage (Current MVP)

**User Data:**
- In-memory object (resets on server restart)
- Structure: `{ email: string, name: string, passwordHash: string }`

**File Storage:**
- Local filesystem (`./backend/uploads/`)
- Files named: `{timestamp}-{sanitized_filename}`
- Accessible via `/uploads/{filename}` route

## Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │ 1. POST /api/auth/signup                      │
     │    { email, password, name }                  │
     ├───────────────────────────────────────────────►
     │                                                │
     │                    2. Hash password (bcrypt)   │
     │                    3. Store in memory          │
     │                                                │
     │◄───────────────────────────────────────────────┤
     │ 4. { ok: true }                               │
     │                                                │
     │ 5. POST /api/auth/login                       │
     │    { email, password }                        │
     ├───────────────────────────────────────────────►
     │                                                │
     │                    6. Verify password          │
     │                    7. Generate JWT             │
     │                                                │
     │◄───────────────────────────────────────────────┤
     │ 8. { token: "jwt...", email, name }           │
     │                                                │
     │ 9. Store token in localStorage                │
     │                                                │
```

## File Upload Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │ 1. User selects file                          │
     │                                                │
     │ 2. POST /api/docs/upload                      │
     │    FormData: { file }                         │
     │    Header: Authorization: Bearer <jwt>        │
     ├───────────────────────────────────────────────►
     │                                                │
     │                    3. Verify JWT (middleware)  │
     │                    4. Validate file type       │
     │                    5. Check file size          │
     │                    6. Save to ./uploads/       │
     │                                                │
     │◄───────────────────────────────────────────────┤
     │ 7. { ok: true, filename, url }                │
     │                                                │
     │ 8. Display success message                    │
     │                                                │
```

## Future Architecture (Phase 2+)

### Database Layer (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_url VARCHAR(500),
  file_type VARCHAR(50),
  file_size INTEGER,
  upload_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'uploaded'
);

-- Tax forms table
CREATE TABLE tax_forms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  document_id INTEGER REFERENCES documents(id),
  tax_year INTEGER,
  form_data JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP
);
```

### AI Integration (OpenAI)

```typescript
// Future AI endpoint
app.post("/api/ai/extract", authMiddleware, async (req, res) => {
  const { documentId } = req.body;
  
  // 1. Get document from database
  // 2. Read file content
  // 3. Send to OpenAI API for extraction
  // 4. Parse structured data
  // 5. Return extracted tax info
  
  res.json({ 
    extractedData: {
      income: 1500000,
      deductions: 200000,
      taxPaid: 100000
    }
  });
});
```

### WhatsApp Bot Integration

```typescript
// Webhook for WhatsApp messages
app.post("/api/whatsapp/webhook", async (req, res) => {
  const { from, message, media } = req.body;
  
  // 1. Identify user by phone number
  // 2. Process message intent
  // 3. Handle file uploads
  // 4. Send automated responses
  
  res.json({ success: true });
});
```

## Deployment Architecture (Production)

```
Internet
   │
   ├─► Cloudflare (CDN + DDoS protection)
   │
   ├─► Vercel (Frontend hosting)
   │      └─► React build (static files)
   │
   └─► Railway/Render (Backend hosting)
          ├─► Express server
          ├─► PostgreSQL database
          └─► Redis (session storage)
          
AWS S3 (File storage)
   └─► Uploaded documents (encrypted)

OpenAI API (AI processing)
   └─► Document extraction

Twilio (WhatsApp Business API)
   └─► WhatsApp bot
```

## Security Considerations

### Current (MVP)
- JWT authentication
- Password hashing (bcryptjs)
- CORS enabled
- File type validation
- File size limits

### Production Required
- [ ] HTTPS/SSL everywhere
- [ ] Rate limiting
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Helmet.js security headers
- [ ] File encryption at rest
- [ ] Virus scanning on uploads
- [ ] Audit logging
- [ ] Session management
- [ ] Two-factor authentication (2FA)

## Performance Optimization

### Future Improvements
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] CDN for static assets
- [ ] Image/PDF compression
- [ ] Lazy loading on frontend
- [ ] Code splitting
- [ ] Server-side rendering (SSR)
- [ ] API response pagination

## Monitoring & Logging

### Recommended Tools
- **Backend:** Winston or Pino
- **Frontend:** Sentry
- **Infrastructure:** DataDog or New Relic
- **Analytics:** Google Analytics or Mixpanel

---

**Document Version:** 1.0  
**Last Updated:** December 2025
