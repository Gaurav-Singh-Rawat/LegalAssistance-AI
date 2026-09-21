const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const {
  uploadDocument,
  reanalyzeDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} = require('../controllers/documentController');
const { askDocumentQuestion } = require('../controllers/qaController');
const { uploadLimiter, aiLimiter } = require('../middleware/rateLimiter');

// Upload endpoint with upload rate limiter (max 15 uploads / 15 mins)
router.post('/upload', uploadLimiter, upload.single('file'), uploadDocument);

// Get list of all documents
router.get('/', getDocuments);

// Get single document by ID
router.get('/:id', getDocumentById);

// Re-analyze existing document with Gemini AI (protected by AI limiter)
router.post('/:id/reanalyze', aiLimiter, reanalyzeDocument);

// Ask question about document using RAG + Gemini (protected by AI limiter)
router.post('/:id/ask', aiLimiter, askDocumentQuestion);

// Delete document by ID
router.delete('/:id', deleteDocument);

module.exports = router;
