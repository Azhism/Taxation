# 🇵🇰 AI-Powered Tax Filing for Pakistan

An AI-powered tax filing platform designed specifically for Pakistan, starting with salaried individuals. This system simplifies income tax and wealth statement preparation, reducing the complexity of IRIS (FBR's tax portal).

## 🎯 Vision

Build a simple, trustworthy platform where Pakistani taxpayers can:
- Upload salary slips and tax documents
- Get automated tax form preparation using AI
- Receive guided help via web platform and WhatsApp bot
- File FBR-compliant tax returns without hassle

## 🚀 Tech Stack

**Backend:**
- TypeScript
- Node.js + Express
- JWT Authentication
- Multer (file uploads)
- bcryptjs (password hashing)

**Frontend:**
- React 18
- TypeScript
- Vite (build tool)
- React Router DOM

## 📁 Project Structure

```
Side-Hustle/
├── backend/
│   ├── src/
│   │   └── index.ts          # Express server with auth & upload endpoints
│   ├── uploads/              # Local file storage (created at runtime)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                  # Environment variables
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.tsx   # Landing page
    │   │   ├── Signup.tsx    # User registration
    │   │   ├── Login.tsx     # User login
    │   │   ├── Dashboard.tsx # User dashboard
    │   │   └── UploadPage.tsx # Document upload
    │   ├── main.tsx          # App entry point with routing
    │   ├── index.css         # Global styles
    │   └── vite-env.d.ts     # Vite type declarations
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Backend Setup

1. Navigate to backend directory:
```powershell
cd d:\Side-Hustle\backend
```

2. Install dependencies:
```powershell
npm install
```

3. Configure environment variables (`.env` file already created):
```
JWT_SECRET=your_secure_jwt_secret_change_this_in_production
PORT=4000
```

4. Start the development server:
```powershell
npm run dev
```

Backend will run on: `http://localhost:4000`

### Frontend Setup

1. Navigate to frontend directory:
```powershell
cd d:\Side-Hustle\frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

Frontend will run on: `http://localhost:3000`

## 🎮 How to Use

1. **Open the frontend** in your browser: `http://localhost:3000`
2. **Sign up** for a new account
3. **Login** with your credentials
4. Navigate to the **Dashboard**
5. Click **Get Started** to upload documents
6. Upload PDF, PNG, or JPG files (salary slips, tax certificates)
7. Files are saved in `backend/uploads/` directory

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token

### Document Management
- `POST /api/docs/upload` - Upload tax documents (requires authentication)

### Health Check
- `GET /api/health` - API status check

## 📋 Current Features (MVP)

✅ User signup and login with JWT authentication  
✅ Secure password hashing with bcryptjs  
✅ File upload (PDF, PNG, JPG) with validation  
✅ Protected routes with authentication middleware  
✅ Responsive React frontend  
✅ Local file storage for uploaded documents  

## 🚧 Planned Features (Future Phases)

### Phase 2: AI Integration
- [ ] OpenAI integration for document text extraction
- [ ] Automated FBR form filling
- [ ] Income and deduction calculation

### Phase 3: WhatsApp Bot
- [ ] WhatsApp Business API integration
- [ ] Document upload via WhatsApp
- [ ] Automated responses and status updates

### Phase 4: Database & Persistence
- [ ] PostgreSQL database integration
- [ ] User document history
- [ ] Tax filing records

### Phase 5: FBR Integration
- [ ] IRIS portal integration
- [ ] PRAL invoicing system
- [ ] Direct e-filing capability

### Phase 6: Business Tax Filing
- [ ] Support for business tax returns
- [ ] Sales tax filing
- [ ] Corporate tax support

## 🔒 Security Notes (Production Checklist)

⚠️ **Current setup is for development only**

For production deployment:
- [ ] Use a proper database (PostgreSQL/MongoDB) instead of in-memory storage
- [ ] Store JWT in httpOnly cookies instead of localStorage
- [ ] Use environment variables for all secrets
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add file virus scanning for uploads
- [ ] Use cloud storage (S3/GCS) instead of local filesystem
- [ ] Enable HTTPS/SSL
- [ ] Add input validation and sanitization
- [ ] Implement logging (winston/morgan)
- [ ] Add CORS configuration for specific domains
- [ ] Set up monitoring and error tracking
- [ ] Implement file size and type validation
- [ ] Add session management

## 🌍 Future Expansion

The platform is designed to be scalable to other countries with similar tax filing pain points:
- Bangladesh
- India (simplified version)
- Sri Lanka
- Other developing markets

## 📝 Development Notes

### In-Memory Storage
Currently, user data is stored in memory (`users` object in backend). This resets when the server restarts. Implement a database for persistence.

### File Storage
Files are saved locally in `backend/uploads/`. For production, use cloud storage with signed URLs.

### Authentication
JWT tokens expire in 24 hours. Tokens are stored in localStorage (suitable for MVP, use httpOnly cookies for production).

## 🤝 Contributing

This is a startup project. Future contribution guidelines will be added.

## 📄 License

ISC

## 📞 Support

For queries related to this project, please contact the development team.

---

**Made with ❤️ for Pakistani taxpayers**
