# LexiAssist: GenAI Legal Information Assistant

LexiAssist is a web application that helps users understand legal documents in plain language. Users can upload PDF or Word documents, review AI-generated analysis, identify clauses and obligations, assess risks, create checklists, and ask questions grounded in the uploaded document.

> **Disclaimer:** LexiAssist provides legal information and document assistance. It is not a substitute for advice from a qualified legal professional.

## Features

- User registration and login with JWT authentication
- Password hashing with `bcryptjs`
- PDF, DOC, and DOCX uploads up to 10 MB
- Text extraction and intelligent document chunking
- Gemini-powered document summaries and legal analysis
- Clause, obligation, risk, and deadline identification
- Checklist generation
- Grounded document Q&A with relevant source context
- MongoDB Atlas persistence with GridFS document storage
- MongoDB Atlas Vector Search for semantic retrieval
- Document listing, viewing, re-analysis, and deletion
- Server-side rate limiting for API, uploads, and AI requests
- Client-side upload locking and Q&A cooldown handling
- Health and Gemini configuration endpoints
- Responsive React interface with a legal-tech workspace layout

## Architecture

```text
                    +----------------------+
                    |  React + Vite UI     |
                    |  Vercel              |
                    +----------+-----------+
                               |
                     VITE_API_URL / API calls
                               |
                    +----------v-----------+
                    |  Express REST API    |
                    |  Render              |
                    +----+-------------+---+
                         |             |
              +----------v--+     +----v-----------+
              | MongoDB      |     | Google Gemini  |
              | Atlas        |     | API            |
              | Data + GridFS|     | Analysis/RAG   |
              +-------------+     +----------------+
```

### Project structure

```text
.
├── backend/
│   ├── package.json
│   └── src/
│       ├── config/          # Database connection
│       ├── controllers/     # Authentication, documents, and Q&A logic
│       ├── middleware/      # Auth, uploads, errors, and rate limits
│       ├── models/          # User, document, and document chunk schemas
│       ├── routes/          # REST API route definitions
│       ├── services/        # Gemini and RAG services
│       └── utils/           # Chunking, extraction, and GridFS helpers
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/      # React UI components
│       ├── services/        # API client
│       ├── App.jsx
│       └── index.css
├── STEPS.md                # Development log and implementation notes
└── README.md
```

## Technology stack

- **Frontend:** React 18, Vite, Lucide React
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **File storage:** MongoDB GridFS
- **AI:** Google Gemini API
- **Authentication:** JWT and bcryptjs
- **Document processing:** `pdf-parse`, `mammoth`
- **Security and reliability:** CORS, `express-rate-limit`, Multer validation

## Requirements

- Node.js 18 or later
- npm
- A MongoDB Atlas database
- A Google Gemini API key

## Local development

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure the backend

Create `backend/.env` with the following values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Never commit `backend/.env` or any API keys to GitHub.

### 3. Start the backend

```bash
cd backend
npm run dev
```

The API runs on `http://localhost:5000` by default.

### 4. Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5173`.

During local development, Vite proxies `/api` requests to `http://localhost:5000`. The proxy is configured in [frontend/vite.config.js](frontend/vite.config.js).

## Production deployment

The recommended deployment uses two services:

### Backend on Render

Create a Render Web Service with:

- **Root directory:** `backend`
- **Build command:** `npm install`
- **Start command:** `npm start`

Add these environment variables in Render:

```env
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection string>
GEMINI_API_KEY=<Google Gemini API key>
GEMINI_MODEL=<supported Gemini model>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://<your-vercel-domain>
```

Render provides the `PORT` variable automatically. The backend listens on that value. The server also trusts Render's forwarded proxy IP so rate limiting works correctly in production.

### Frontend on Vercel

Import the repository into Vercel and configure:

- **Root directory:** `frontend`
- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

Add this Vercel environment variable:

```env
VITE_API_URL=https://<your-render-backend-domain>/api
```

The frontend reads this value from [frontend/src/services/api.js](frontend/src/services/api.js). If it is not set, it uses `/api`, which is suitable for local Vite proxy development.

After deploying the frontend, set its Vercel URL as `CLIENT_URL` on Render and redeploy the backend if necessary.

## API reference

All routes are prefixed with `/api`.

### Health

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Returns API, database, and Gemini configuration status |
| `GET` | `/test-gemini` | Tests configured Gemini models |

### Authentication

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Creates a user account and returns a JWT |
| `POST` | `/auth/login` | Authenticates a user and returns a JWT |
| `GET` | `/auth/me` | Returns the authenticated user |

Protected requests use:

```http
Authorization: Bearer <jwt-token>
```

### Documents and Q&A

| Method | Route | Description |
|---|---|---|
| `POST` | `/documents/upload` | Uploads and analyzes a PDF or Word document |
| `GET` | `/documents` | Lists available documents |
| `GET` | `/documents/:id` | Gets one document and its analysis |
| `POST` | `/documents/:id/reanalyze` | Runs Gemini analysis again |
| `POST` | `/documents/:id/ask` | Asks a grounded question about a document |
| `DELETE` | `/documents/:id` | Deletes a document and its stored file data |

For uploads, send the file as multipart form data using the field name `file`.

## Rate limits

The backend applies IP-based rate limits to protect the API and Gemini quota:

- General API traffic: 120 requests per 15 minutes
- Document uploads: 15 uploads per 15 minutes
- AI Q&A and re-analysis: 30 requests per 15 minutes
- Frontend Q&A cooldown: 2 seconds between submissions

A rate-limited request returns HTTP `429` with a retry message.

## Useful checks

Once the backend is running, open:

```text
http://localhost:5000/
http://localhost:5000/api/health
```

Build the frontend before deployment:

```bash
cd frontend
npm run build
```

## Deployment differences

The GitHub repository contains the application source code used by both deployments. The functional code is shared, but the runtime configuration differs:

- Vercel serves the compiled React frontend.
- Render runs the Express backend and supplies the production port.
- Production uses `VITE_API_URL` instead of the local Vite API proxy.
- Render supplies production values for MongoDB, Gemini, JWT, and CORS configuration.
- Render's forwarded client IP handling is enabled for reliable rate limiting.

## License

This project is intended for educational and demonstration purposes.
