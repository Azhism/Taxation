# ✅ Setup Checklist

Use this checklist to ensure everything is set up correctly.

## Prerequisites

- [ ] Node.js 18+ installed
  - Check: `node --version`
  - Download: https://nodejs.org

- [ ] npm installed (comes with Node.js)
  - Check: `npm --version`

- [ ] PowerShell available
  - Check: `$PSVersionTable.PSVersion`

- [ ] Git installed (optional, for version control)
  - Check: `git --version`

## Installation Steps

### Backend Setup

- [ ] Navigate to backend directory: `cd d:\Side-Hustle\backend`
- [ ] Install dependencies: `npm install`
- [ ] Verify `.env` file exists with JWT_SECRET
- [ ] Check for errors in installation

### Frontend Setup

- [ ] Navigate to frontend directory: `cd d:\Side-Hustle\frontend`
- [ ] Install dependencies: `npm install`
- [ ] Check for errors in installation

## First Run

- [ ] Open terminal and start backend: `cd backend; npm run dev`
- [ ] Verify backend starts on port 4000
- [ ] See "API running on http://localhost:4000" message

- [ ] Open new terminal and start frontend: `cd frontend; npm run dev`
- [ ] Verify frontend starts on port 3000
- [ ] See "Local: http://localhost:3000" message

## Testing the App

### Basic Functionality

- [ ] Open browser to http://localhost:3000
- [ ] Landing page loads correctly
- [ ] Click "Get Started" button
- [ ] Signup page loads

### User Registration

- [ ] Enter email address
- [ ] Enter password
- [ ] Enter full name (optional)
- [ ] Click "Create Account"
- [ ] Redirected to login page

### User Login

- [ ] Enter registered email
- [ ] Enter password
- [ ] Click "Login"
- [ ] Redirected to dashboard
- [ ] See welcome message with your name

### File Upload

- [ ] On dashboard, click "Get Started"
- [ ] Upload page loads
- [ ] Click "Choose File"
- [ ] Select a PDF, PNG, or JPG file (max 10MB)
- [ ] Click "Upload Document"
- [ ] See success message
- [ ] Verify file exists in `backend/uploads/` folder

### Verification

- [ ] Check browser console (F12) - no errors
- [ ] Check backend terminal - see upload request logged
- [ ] Navigate back to dashboard
- [ ] Logout works correctly
- [ ] Login again with same credentials

## Common Issues Checklist

### Backend Won't Start

- [ ] Port 4000 is not already in use
- [ ] Dependencies installed: `backend/node_modules` exists
- [ ] No syntax errors in `backend/src/index.ts`
- [ ] `.env` file exists in backend folder

### Frontend Won't Start

- [ ] Port 3000 is not already in use
- [ ] Dependencies installed: `frontend/node_modules` exists
- [ ] No syntax errors in React components
- [ ] `index.html` exists in frontend root

### Upload Fails

- [ ] Backend is running on port 4000
- [ ] User is logged in (check localStorage for TOKEN)
- [ ] File type is PDF, PNG, or JPG
- [ ] File size is under 10MB
- [ ] JWT token is valid (not expired)

### Login Fails

- [ ] Backend is running
- [ ] Correct email/password entered
- [ ] User was previously registered
- [ ] Check backend terminal for error messages

## Development Workflow

### Daily Startup

- [ ] Open VS Code in `d:\Side-Hustle`
- [ ] Run `.\setup.ps1` (first time only)
- [ ] Run `.\run-dev.ps1` to start both servers
- [ ] Open http://localhost:3000 in browser

### Making Changes

**Backend Changes:**
- [ ] Edit files in `backend/src/`
- [ ] Server auto-restarts (ts-node-dev)
- [ ] Check terminal for errors

**Frontend Changes:**
- [ ] Edit files in `frontend/src/`
- [ ] Browser auto-refreshes (Vite HMR)
- [ ] Check browser console for errors

### Before Committing Code

- [ ] Both servers start without errors
- [ ] No TypeScript compilation errors
- [ ] Test signup/login/upload flow
- [ ] Check browser console - no errors
- [ ] Review changed files

## Production Readiness Checklist

*For when you're ready to deploy*

### Security

- [ ] Replace in-memory storage with database
- [ ] Use environment variables for all secrets
- [ ] Change JWT secret to strong random value
- [ ] Implement rate limiting
- [ ] Add input validation/sanitization
- [ ] Enable HTTPS/SSL
- [ ] Use httpOnly cookies instead of localStorage
- [ ] Add CORS whitelist for specific domains
- [ ] Implement file virus scanning
- [ ] Add security headers (Helmet.js)

### Infrastructure

- [ ] Set up PostgreSQL database
- [ ] Configure cloud file storage (S3/GCS)
- [ ] Set up Redis for sessions
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (DataDog, New Relic)
- [ ] Configure error tracking (Sentry)
- [ ] Set up logging (Winston, CloudWatch)

### Deployment

- [ ] Build frontend: `npm run build`
- [ ] Build backend: `npm run build`
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment variables
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Deploy backend to Railway/Render
- [ ] Test production URLs
- [ ] Set up domain and DNS

### Testing

- [ ] Write unit tests (Jest)
- [ ] Write integration tests
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Test file upload edge cases
- [ ] Performance testing
- [ ] Security audit

## Resources

- **Main Documentation:** [README.md](README.md)
- **Quick Start Guide:** [QUICKSTART.md](QUICKSTART.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Build Summary:** [BUILD_SUMMARY.md](BUILD_SUMMARY.md)

## Getting Help

If you're stuck:

1. Check the error message carefully
2. Search the error in documentation
3. Check browser console (F12)
4. Check backend terminal logs
5. Review the relevant source files
6. Try restarting servers
7. Try clearing node_modules and reinstalling

## Success Criteria

✅ You're ready to develop when:
- Both servers start without errors
- Landing page loads at localhost:3000
- You can signup, login, and upload files
- No console errors in browser or terminal

---

**Last Updated:** December 4, 2025

Good luck with your AI tax filing startup! 🚀🇵🇰
