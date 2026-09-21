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

// Upload endpoint
router.post('/upload', upload.single('file'), uploadDocument);

// Get list of all documents
router.get('/', getDocuments);

// Get single document by ID
router.get('/:id', getDocumentById);

// Re-analyze existing document with Gemini AI
router.post('/:id/reanalyze', reanalyzeDocument);

// Ask question about document using RAG + Gemini
router.post('/:id/ask', askDocumentQuestion);

// Delete document by ID
router.delete('/:id', deleteDocument);

module.exports = router;
