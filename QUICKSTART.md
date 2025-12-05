# 🚀 Quick Start Guide

## Automated Setup (Recommended)

### Option 1: Run Setup Script
```powershell
cd d:\Side-Hustle
.\setup.ps1
```

This will install all dependencies for both backend and frontend.

### Option 2: Start Development Servers
After running setup, start both servers at once:
```powershell
.\run-dev.ps1
```

This opens two PowerShell windows - one for backend, one for frontend.

---

## Manual Setup

### Backend

1. Open PowerShell and navigate to backend:
```powershell
cd d:\Side-Hustle\backend
```

2. Install dependencies:
```powershell
npm install
```

3. Start development server:
```powershell
npm run dev
```

Backend runs on: **http://localhost:4000**

### Frontend

1. Open a **new** PowerShell window and navigate to frontend:
```powershell
cd d:\Side-Hustle\frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start development server:
```powershell
npm run dev
```

Frontend runs on: **http://localhost:3000**

---

## Testing the Application

1. Open browser to `http://localhost:3000`
2. Click "Get Started" to create an account
3. Fill in your details and sign up
4. Login with your credentials
5. Navigate to Dashboard
6. Click "Get Started" and upload a test document (PDF/PNG/JPG)
7. Verify the upload succeeded

---

## Project URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React app (user interface) |
| Backend API | http://localhost:4000 | Express server (API endpoints) |
| API Health | http://localhost:4000/api/health | Check if backend is running |

---

## Common Issues

### Backend won't start
- Check if port 4000 is already in use
- Verify Node.js is installed: `node --version`
- Try deleting `node_modules` and running `npm install` again

### Frontend won't start
- Check if port 3000 is already in use
- Verify all dependencies installed correctly
- Try: `npm install --legacy-peer-deps`

### File upload fails
- Ensure backend is running on port 4000
- Check browser console for errors
- Verify you're logged in (token exists)

### TypeScript errors
- Run `npm install` in both directories
- Restart VS Code
- TypeScript errors in IDE are normal before `npm install`

---

## File Locations

**Uploaded files:** `d:\Side-Hustle\backend\uploads\`  
**Backend logs:** Console where you ran `npm run dev`  
**Environment config:** `d:\Side-Hustle\backend\.env`

---

## Next Steps

Once the MVP is working:

1. **Add Database:** Integrate PostgreSQL for user/document persistence
2. **Add AI:** Integrate OpenAI API for document extraction
3. **WhatsApp Bot:** Set up Twilio/WhatsApp Business API
4. **Cloud Storage:** Replace local file storage with AWS S3
5. **Deploy:** Host on Vercel (frontend) + Railway/Render (backend)

---

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review API endpoints in `backend/src/index.ts`
- Review React pages in `frontend/src/pages/`

**Happy Coding! 🇵🇰**
