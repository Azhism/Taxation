# User Flow Guide

This document illustrates the complete user journey through the AI Tax Filing platform.

## 🎯 User Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      1. DISCOVERY PHASE                         │
│                                                                 │
│  User arrives → Landing Page (http://localhost:3000)           │
│                                                                 │
│  Sees:                                                          │
│  • Product description                                          │
│  • How it works (3 steps)                                       │
│  • Value proposition for Pakistan tax filing                    │
│  • "Get Started" and "Login" buttons                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. REGISTRATION PHASE                        │
│                                                                 │
│  New User → Clicks "Get Started" → Signup Page                 │
│                                                                 │
│  Enters:                                                        │
│  • Full Name (optional)                                         │
│  • Email Address                                                │
│  • Password                                                     │
│                                                                 │
│  Clicks "Create Account"                                        │
│                                                                 │
│  Backend:                                                       │
│  ✓ Validates email and password                                │
│  ✓ Hashes password with bcryptjs                               │
│  ✓ Stores user in memory                                       │
│  ✓ Returns success                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     3. AUTHENTICATION PHASE                     │
│                                                                 │
│  User → Redirected to Login Page                               │
│                                                                 │
│  Enters:                                                        │
│  • Email Address                                                │
│  • Password                                                     │
│                                                                 │
│  Clicks "Login"                                                 │
│                                                                 │
│  Backend:                                                       │
│  ✓ Finds user by email                                         │
│  ✓ Compares password hash                                      │
│  ✓ Generates JWT token (24h expiry)                            │
│  ✓ Returns token + user info                                   │
│                                                                 │
│  Frontend:                                                      │
│  ✓ Stores JWT in localStorage                                  │
│  ✓ Stores user info (email, name)                              │
│  ✓ Redirects to Dashboard                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      4. DASHBOARD PHASE                         │
│                                                                 │
│  User → Dashboard Page (Protected Route)                       │
│                                                                 │
│  Sees:                                                          │
│  • Welcome message with name                                    │
│  • Product information                                          │
│  • "Get Started" button for uploads                            │
│  • Document list (empty initially)                             │
│  • Tips for filing                                             │
│  • Logout button                                               │
│                                                                 │
│  Security Check:                                                │
│  ✓ Checks for JWT token in localStorage                        │
│  ✓ If no token → redirect to login                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. DOCUMENT UPLOAD PHASE                     │
│                                                                 │
│  User → Clicks "Get Started" → Upload Page                     │
│                                                                 │
│  Actions:                                                       │
│  1. Click "Choose File"                                         │
│  2. Select document (PDF/PNG/JPG)                               │
│  3. See file preview (name + size)                              │
│  4. Click "Upload Document"                                     │
│                                                                 │
│  Frontend:                                                      │
│  • Creates FormData with file                                   │
│  • Adds Authorization header with JWT                           │
│  • POSTs to /api/docs/upload                                    │
│  • Shows "Uploading..." state                                   │
│                                                                 │
│  Backend:                                                       │
│  ✓ Verifies JWT token                                          │
│  ✓ Validates file type (PDF/PNG/JPG)                           │
│  ✓ Checks file size (max 10MB)                                 │
│  ✓ Generates unique filename                                    │
│  ✓ Saves to ./uploads/ directory                                │
│  ✓ Returns success + file URL                                  │
│                                                                 │
│  User sees:                                                     │
│  ✅ "Uploaded successfully: {filename}"                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      6. POST-UPLOAD PHASE                       │
│                                                                 │
│  Current State (MVP):                                           │
│  • File saved locally                                           │
│  • Success message shown                                        │
│  • User can upload more files                                   │
│                                                                 │
│  Future State (Phase 2):                                        │
│  • AI extracts text from document                               │
│  • System identifies salary info                                │
│  • Pre-fills FBR tax form                                       │
│  • Shows preview for review                                     │
│  • User confirms and submits                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Page-by-Page Breakdown

### Page 1: Landing Page (/)

**Purpose:** Introduce product and capture leads

**Elements:**
- Hero section with Pakistan flag emoji 🇵🇰
- Value proposition headline
- Feature list (How it works)
- Benefits section
- Call-to-action buttons

**User Actions:**
- Click "Get Started" → Go to Signup
- Click "Login" → Go to Login

**No Authentication Required**

---

### Page 2: Signup (/signup)

**Purpose:** User registration

**Form Fields:**
- Full Name (text, optional)
- Email (email, required)
- Password (password, required)

**Validation:**
- Email format validation (browser)
- Required field validation
- Backend checks for existing email

**Success Flow:**
1. Submit form
2. Backend creates user
3. Redirect to /login

**Error Handling:**
- Show error message if email exists
- Show error if network fails

**Link:** "Already have an account? Login"

---

### Page 3: Login (/login)

**Purpose:** User authentication

**Form Fields:**
- Email (email, required)
- Password (password, required)

**Validation:**
- Email format validation
- Required field validation
- Backend verifies credentials

**Success Flow:**
1. Submit form
2. Backend returns JWT token
3. Store token in localStorage
4. Store user info in localStorage
5. Redirect to /dashboard

**Error Handling:**
- Show error if credentials invalid
- Show error if network fails

**Link:** "Don't have an account? Sign up"

---

### Page 4: Dashboard (/dashboard)

**Purpose:** User home page after authentication

**Protection:** Requires valid JWT token

**Elements:**
- User welcome message with name
- Product information card
- Upload button
- Document list (future)
- Filing tips section
- Logout button

**User Actions:**
- Click "Get Started" → Go to /upload
- Click "Logout" → Clear localStorage, go to /

**Security:**
- Checks localStorage for TOKEN
- If no token → Redirect to /login

---

### Page 5: Upload Page (/upload)

**Purpose:** Document upload interface

**Protection:** Requires valid JWT token

**Elements:**
- Back to Dashboard link
- File input (accept PDF/PNG/JPG)
- Selected file preview
- Upload button (disabled until file selected)
- Success/error message area
- Supported formats info

**User Actions:**
1. Click file input
2. Select file from computer
3. See file name and size
4. Click "Upload Document"
5. See upload progress
6. See success/error message

**File Validation:**
- Client: File type check
- Client: Show file info
- Server: MIME type validation
- Server: Size limit check (10MB)

**Success Flow:**
1. File selected
2. FormData created
3. POST to /api/docs/upload with JWT
4. Backend saves file
5. Returns file URL
6. Show success message
7. Reset form for next upload

---

## 🔐 Authentication Flow Details

### Token Lifecycle

```
User Login
    │
    ├─► Backend generates JWT
    │   • Payload: { email }
    │   • Secret: JWT_SECRET from .env
    │   • Expiry: 24 hours
    │
    ├─► Frontend receives token
    │   • Stores in localStorage as "TOKEN"
    │   • Stores user email and name
    │
    ├─► Authenticated Requests
    │   • Include header: Authorization: Bearer <token>
    │   • Backend verifies signature
    │   • Backend checks expiry
    │   • If valid → process request
    │   • If invalid → return 401 error
    │
    └─► Token Expiry (24h)
        • User must login again
        • Old token becomes invalid
```

### Protected Route Check

**Client-side (React):**
```typescript
const token = localStorage.getItem("TOKEN");
if (!token) {
  return <Redirect to="/login" />;
}
```

**Server-side (Express):**
```typescript
const token = req.headers.authorization?.split(" ")[1];
if (!token) {
  return res.status(401).json({ error: "no token" });
}
try {
  const payload = jwt.verify(token, JWT_SECRET);
  req.user = payload;
  next();
} catch {
  return res.status(401).json({ error: "invalid token" });
}
```

---

## 📁 File Upload Flow Details

### Client-side Process

1. **File Selection:**
   ```typescript
   <input type="file" accept=".pdf,image/png,image/jpeg" />
   ```

2. **File Preview:**
   ```typescript
   if (file) {
     console.log(file.name, file.size);
   }
   ```

3. **Form Submission:**
   ```typescript
   const formData = new FormData();
   formData.append("file", file);
   
   fetch("/api/docs/upload", {
     method: "POST",
     body: formData,
     headers: {
       Authorization: `Bearer ${token}`
     }
   });
   ```

### Server-side Process

1. **Authentication:**
   - Extract JWT from header
   - Verify token signature
   - Check expiry

2. **File Validation:**
   - Check MIME type (PDF/PNG/JPG only)
   - Check file size (<10MB)

3. **File Storage:**
   - Generate unique filename: `{timestamp}-{sanitized_name}`
   - Save to `./uploads/` directory
   - Return file metadata

4. **Response:**
   ```json
   {
     "ok": true,
     "filename": "1733265432123-salary_slip.pdf",
     "url": "/uploads/1733265432123-salary_slip.pdf"
   }
   ```

---

## 🚀 Future User Flows (Phase 2+)

### AI Document Processing Flow

```
Upload Complete
    │
    ├─► AI Processing Starts
    │   • Extract text from PDF/image (OCR)
    │   • Identify document type (salary slip, tax cert, etc.)
    │   • Parse structured data
    │
    ├─► Data Extraction
    │   • Gross salary
    │   • Tax deductions
    │   • Employer info
    │   • Tax year
    │
    ├─► Form Pre-fill
    │   • Generate FBR form template
    │   • Fill extracted data
    │   • Calculate tax liability
    │
    ├─► Review & Edit
    │   • Show preview to user
    │   • Allow manual corrections
    │   • Highlight uncertain fields
    │
    └─► Submit to FBR
        • User confirms
        • Generate PDF
        • Submit to IRIS
        • Receive confirmation
```

### WhatsApp Bot Flow

```
User sends document via WhatsApp
    │
    ├─► Bot receives message
    │   • Identify user by phone number
    │   • Download document
    │   • Store in system
    │
    ├─► Process document
    │   • Run AI extraction
    │   • Generate tax form
    │
    ├─► Send confirmation
    │   • "Document received ✓"
    │   • "Processing..."
    │   • "Form ready for review"
    │
    └─► User reviews via web
        • Click link in WhatsApp
        • Review on website
        • Approve and file
```

---

## 📊 State Management

### localStorage Keys

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| TOKEN | string | JWT authentication token | "eyJhbGc..." |
| USER_EMAIL | string | User's email address | "user@example.com" |
| USER_NAME | string | User's full name | "Ahmed Khan" |

### Component State (React)

**Signup/Login:**
- `email` - Input value
- `password` - Input value
- `name` - Input value (signup only)
- `error` - Error message

**Dashboard:**
- None (reads from localStorage)

**Upload:**
- `file` - Selected file object
- `message` - Status message
- `uploading` - Boolean loading state

---

## 🎨 User Experience Highlights

### Visual Feedback

- ✅ Success messages in green
- ❌ Error messages in red
- ⏳ Loading states during async operations
- 📎 File preview before upload
- 🚀 Smooth page transitions

### Error Handling

- Clear error messages
- Network error detection
- File validation feedback
- Authentication state management

### Performance

- Fast page loads (Vite)
- Hot module reload during development
- Minimal bundle size
- Optimized images and assets

---

**Document Version:** 1.0  
**Last Updated:** December 2025
