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
| **Frontend** | React (Vite) + Modern CSS Design System | Fast, modern, responsive glassmorphism user interface |
| **Backend** | Node.js + Express.js | REST API, document processing, auth, and AI orchestration |
| **Database** | MongoDB Atlas | Storing users, documents, chunks, and metadata |
| **Vector Search** | MongoDB Atlas Vector Search | High-speed semantic retrieval of relevant document chunks |
| **AI / LLM** | Google Gemini API (`gemini-1.5-flash`) | Summaries, clause extraction, grounded answering |
| **Embeddings** | Gemini `text-embedding-004` | Generating 768-dimensional vector embeddings for text chunks |
| **Authentication** | JSON Web Tokens (JWT) + bcryptjs | Secure user signup and authenticated document management |

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
│   ├── package.json          # Express, Mongoose, Gemini, Multer, PDF/DOCX dependencies
│   ├── uploads/              # Local storage for uploaded PDF/DOCX documents
│   └── src/
│       ├── config/
│       │   └── db.js         # MongoDB connection handler
│       ├── controllers/
│       │   ├── documentController.js # Upload, chunk, embed, analyze, retrieve, and delete logic
│       │   └── qaController.js       # Grounded RAG question answering controller
│       ├── middleware/
│       │   ├── errorHandler.js # Global 404 & 500 error handlers
│       │   └── uploadMiddleware.js # Multer file upload & validation (PDF/DOCX max 10MB)
│       ├── models/
│       │   ├── User.js          # User schema with bcrypt password hashing
│       │   ├── Document.js      # Structured document analysis schema
│       │   └── DocumentChunk.js # Text chunks with 768-dim embeddings for RAG
│       ├── routes/
│       │   ├── healthRoutes.js   # /api/health monitoring endpoint
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
        │   ├── Header.jsx           # Top navigation and live backend status indicator
        │   ├── DisclaimerBanner.jsx # Prominent legal information notice banner
        │   ├── UploadModal.jsx      # Drag & drop upload modal with progress indicators
        │   ├── DocumentList.jsx     # Dashboard list of uploaded documents
        │   └── DocumentWorkspace.jsx # 6-Tab interactive analysis & grounded Q&A workspace
        ├── services/
        │   └── api.js               # Centralized backend API client
        ├── App.jsx                  # Main application UI layout & navigation
        ├── index.css                # Modern dark-mode glassmorphism design system
        └── main.jsx                 # React root renderer
```

---

## 🔑 Environment Variables Reference

Create a `.env` file inside `backend/`:

```env
# Server Port
PORT=5000

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@h2s.n2clbbx.mongodb.net/LegalAI?retryWrites=true&w=majority&appName=h2s

# Google Gemini API Key (from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Authentication Secret
JWT_SECRET=dev_jwt_secret_key_1234567890_legal_assistant
JWT_EXPIRES_IN=7d
```

---

## 🔍 MongoDB Atlas Vector Search Index Definition

- **Index Name:** `vector_index`
- **Database:** `LegalAI`
- **Collection:** `documentchunks`

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    }
  ]
}
```

---

## 📋 Development Phases & Progress Log

### Phase 1: Local Foundation & Project Scaffolding `[COMPLETED ✅]`
- [x] Initialized project roadmap and step-by-step documentation (`STEPS.md`).
- [x] Initialized `backend/` folder with Express, CORS, logging, and health route.
- [x] Created `frontend/` folder with Vite, React 18, dark-mode glassmorphism design system.

### Phase 2: Database Layer & Data Models `[COMPLETED ✅]`
- [x] Configured Mongoose connection in `backend/src/config/db.js`.
- [x] Created `User.js` model with automatic `bcrypt` password hashing.
- [x] Created `Document.js` model with full structured legal schemas.
- [x] Created `DocumentChunk.js` model with 768-dimensional vector embedding arrays.

### Phase 3: Document Upload & Parsing `[COMPLETED ✅]`
- [x] Implemented `uploadMiddleware.js` (Multer disk storage, PDF/DOCX format validator, 10MB size limit).
- [x] Built `textExtractor.js` with `pdf-parse` for PDFs and `mammoth` for DOCX.
- [x] Built `chunker.js` (800-char window, 150-char overlap, sentence preservation, clause heading detection).

### Phase 4: Gemini AI Integration & RAG Engine `[COMPLETED ✅]`
- [x] Integrated `@google/generative-ai` with `gemini-1.5-flash` and `text-embedding-004`.
- [x] Automated batch vector embeddings generation during document upload.
- [x] Created structured legal analysis prompt for summary, key clauses, obligations, risks, and lawyer checklists.
- [x] Implemented MongoDB Vector Search retrieval (`$vectorSearch`) in `ragService.js`.
- [x] Created grounded Q&A endpoint (`POST /api/documents/:id/ask`) with page/clause citations and anti-hallucination guardrails.

### Phase 5: Frontend Document Analysis Workspace `[COMPLETED ✅]`
- [x] Interactive `UploadModal` with drag-and-drop & live progress.
- [x] Document Dashboard with recent uploads, status badges, and deletion.
- [x] Multi-tab `DocumentWorkspace.jsx`:
  1. Plain-English Executive Summary
  2. Key Clauses with Simplified Meaning & Excerpts
  3. Obligations & Deadlines
  4. Potential Risks & Red Flags
  5. Actionable Lawyer Discussion Checklist
  6. Grounded Q&A Chat with Source Citation Badges & Suggested Inquiries

### Phase 6: Authentication & Security `[NEXT ⏭️]`
- [ ] User registration and login endpoints (`POST /api/auth/register`, `POST /api/auth/login`).
- [ ] Password hashing with `bcryptjs`.
- [ ] JWT authentication middleware for protected document routes.

### Phase 7: Testing & Hallucination Guardrails `[PLANNED]`
- [ ] Test with sample legal agreements (NDA, Lease, Employment Contract).
- [ ] Verify accuracy of citations and fallback responses.

### Phase 8: Deployment Guide `[PLANNED]`
- [ ] Deploy Backend to Render or Railway.
- [ ] Deploy Frontend to Vercel.

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

---
*Updated automatically as each phase is completed.*
