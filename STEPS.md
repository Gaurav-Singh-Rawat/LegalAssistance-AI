# Legal AI Assistant - Project Steps & Development Log

A complete, beginner-friendly development log and guide for the **GenAI-Powered Legal Information Assistant** college project.

---

## 📌 Project Overview
- **Project Name:** GenAI Legal Information Assistant (LexiAssist)
- **Purpose:** An intelligent web assistant that helps users understand complex legal documents (PDF/DOCX) by providing plain-English summaries, identifying clauses, highlighting risks/deadlines, generating checklists, and offering grounded Q&A with source citations.
- **Disclaimer Notice:** *Provides legal information and document assistance, NOT professional legal advice.*

---

## 🛠️ Technology Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Clean Legal-Tech Design System | Minimalist, serious dark navy/charcoal UI |
| **Backend** | Node.js + Express.js + Rate Limiting | REST API, document processing, auth, and AI orchestration |
| **Database** | MongoDB Atlas | Storing users, documents, chunks, and metadata |
| **Vector Search** | MongoDB Atlas Vector Search | High-speed semantic retrieval of relevant document chunks |
| **AI / LLM** | Google Gemini API (`gemini-3.6-flash`) | Summaries, clause extraction, grounded answering |
| **Embeddings** | Gemini `text-embedding-004` / `embedding-001` | Generating vector embeddings for text chunks |
| **Security & Limits** | `express-rate-limit` + Client Debounce | Tiered IP-based rate limiting & anti-spam cooldowns |
| **Authentication** | JSON Web Tokens (JWT) + bcryptjs | Secure user signup and authenticated document management |

---

## 🛡️ Dual Rate-Limiting Architecture

### 1. Server-Side Limits (`backend/src/middleware/rateLimiter.js`)
* **General API Limiter (`/api/*`):** Max 120 requests per 15 minutes per IP.
* **Document Upload Limiter (`POST /api/documents/upload`):** Max 15 uploads per 15 minutes per IP.
* **AI Q&A / Re-Analyze Limiter (`POST /api/documents/:id/ask`, `reanalyze`):** Max 30 requests per 15 minutes per IP.
* Returns standard HTTP `429 Too Many Requests` with a clear message and `retryAfterSeconds`.

### 2. Client-Side Throttling & Cooldowns (`frontend/src/`)
* **Anti-Spam Cooldown:** 2-second client cooldown on the Q&A submit button (`Wait (2s)`).
* **Graceful 429 Handling:** Displays friendly warning toasts instead of crashing the interface.
* **Upload Lock:** Strict boolean upload lock preventing double-submissions.

---

## 📁 Repository Structure

```text
legal-assistance/
├── .gitignore
├── STEPS.md                  # Development progress log and documentation
│
├── backend/                  # Node.js + Express REST API
│   ├── .env.example          # Environment variable template
│   ├── .env                  # Local environment configuration
│   ├── package.json          # Express, Mongoose, Gemini, Multer, Rate Limiting dependencies
│   ├── uploads/              # Local storage for uploaded PDF/DOCX documents
│   └── src/
│       ├── config/
│       │   └── db.js         # MongoDB connection handler
│       ├── controllers/
│       │   ├── documentController.js # Upload, chunk, embed, analyze, retrieve, and delete logic
│       │   └── qaController.js       # Grounded RAG question answering controller
│       ├── middleware/
│       │   ├── errorHandler.js   # Global 404 & 500 error handlers
│       │   ├── rateLimiter.js    # Tiered IP rate limiting (General, Upload, AI)
│       │   └── uploadMiddleware.js # Multer file upload & validation (PDF/DOCX max 10MB)
│       ├── models/
│       │   ├── User.js          # User schema with bcrypt password hashing
│       │   ├── Document.js      # Structured document analysis schema
│       │   └── DocumentChunk.js # Text chunks with embeddings for RAG
│       ├── routes/
│       │   ├── healthRoutes.js   # /api/health and /api/test-gemini monitoring endpoints
│       │   └── documentRoutes.js # /api/documents (upload, reanalyze, ask, list, fetch, delete)
│       ├── services/
│       │   ├── geminiService.js # Google Gemini AI API (embeddings, structured analysis, Q&A)
│       │   └── ragService.js    # MongoDB Atlas Vector Search retrieval ($vectorSearch)
│       ├── utils/
│       │   ├── textExtractor.js # PDF (pdf-parse) & DOCX (mammoth) parser
│       │   └── chunker.js       # Smart recursive chunker with overlap & section detection
│       └── server.js         # Express server entry point
│
└── frontend/                 # Vite + React Client
    ├── index.html            # Web entry point with Plus Jakarta Sans typography
    ├── package.json          # React, Vite, Lucide Icons dependencies
    ├── vite.config.js        # Vite config with API proxy to localhost:5000
    └── src/
        ├── components/
        │   ├── Header.jsx           # Minimalist legal status bar
        │   ├── DisclaimerBanner.jsx # Discrete legal information notice banner
        │   ├── Sidebar.jsx          # Left navigation bar with past documents & active highlighting
        │   ├── UploadModal.jsx      # Clean upload modal with progress indicators
        │   ├── DocumentList.jsx     # Structured legal documents table
        │   └── DocumentWorkspace.jsx # 6-Tab analysis & grounded Q&A workspace
        ├── services/
        │   └── api.js               # Centralized backend API client
        ├── App.jsx                  # Main application shell with Sidebar layout
        ├── index.css                # Polished legal-tech design system (Dark navy/charcoal)
        └── main.jsx                 # React root renderer
```

---

## 📋 Development Phases & Progress Log

### Phase 1: Local Foundation & Project Scaffolding `[COMPLETED ✅]`
- [x] Initialized project roadmap and step-by-step documentation (`STEPS.md`).
- [x] Initialized `backend/` folder with Express, CORS, logging, and health route.
- [x] Created `frontend/` folder with Vite, React 18, clean design system.

### Phase 2: Database Layer & Data Models `[COMPLETED ✅]`
- [x] Configured Mongoose connection in `backend/src/config/db.js`.
- [x] Created `User.js`, `Document.js`, and `DocumentChunk.js` schemas.

### Phase 3: Document Upload & Parsing `[COMPLETED ✅]`
- [x] Implemented `uploadMiddleware.js` (PDF/DOCX max 10MB limit).
- [x] Built `textExtractor.js` (`pdf-parse` & `mammoth`) and `chunker.js`.
- [x] Fixed permanent deletion flow across MongoDB and local disk storage.

### Phase 4: Gemini AI Integration & RAG Engine `[COMPLETED ✅]`
- [x] Integrated Gemini-based document analysis and legal question answering.
- [x] Added structured document processing and retrieval flows for grounded answers.
- [x] Maintained the legal document Q&A workflow around AI-generated analysis and contextual retrieval.

### Phase 5: Legal-Tech UI/UX Redesign `[COMPLETED ✅]`
- [x] Built left **Sidebar** displaying past uploaded documents.
- [x] Clean homepage hero with concise value proposition and structured documents table.
- [x] 6-Tab document workspace (Overview, Clauses, Obligations, Risks, Checklist, Q&A).
- [x] Professional dark navy/charcoal aesthetic with restrained indigo accent.

### Phase 6: Security, Validation & Test Hardening `[COMPLETED ✅]`
- [x] Implemented tiered server-side IP rate limiting (`express-rate-limit`).
- [x] Implemented client-side debounce cooldowns and friendly 429 alerts.
- [x] Added backend input validation for authentication flows.
- [x] Added security hardening for the Express server, including Helmet and stricter content handling.
- [x] Added automated smoke tests for backend API validation and frontend UI render validation.

---

## ✅ What was actually tested

These checks were run successfully in the current workspace:

### Backend verification
```bash
cd backend
npm test
```
Result: 3 tests passed, 0 failed.
Validated behavior:
- API health endpoint returns a healthy response
- invalid registration request is rejected
- invalid login request is rejected

### Frontend verification
```bash
cd frontend
npm test
```
Result: 1 test file passed, 1 test passed, 0 failed.
Validated behavior:
- the main app loads and renders the primary landing view

### Known environment caveat
- MongoDB Atlas connectivity still depends on an allowed IP address in the database whitelist.
- A connection warning can still appear when the database is unavailable from the current execution environment.
- The app logic is smoke-tested and working, while full database-backed flows require a reachable MongoDB connection and valid Gemini configuration.

---

## 💻 Commands Quick Reference

### Running the Backend:
```bash
cd backend
npm run dev
```

### Running the Frontend:
```bash
cd frontend
npm run dev
```

### Build check before deployment:
```bash
cd frontend
npm run build
```

---
*Updated to reflect the verified status of the current project implementation.*
