const Document = require('../models/Document');
const { retrieveRelevantChunks } = require('../services/ragService');
const { answerDocumentQuestion } = require('../services/geminiService');

/**
 * @desc    Ask a question about an uploaded document using Grounded RAG + Gemini
 * @route   POST /api/documents/:id/ask
 * @access  Public / Protected
 */
const askDocumentQuestion = async (req, res) => {
  const { id } = req.params;
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a question to ask about this document.',
    });
  }

  try {
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    // 1. Retrieve top-K relevant chunks using RAG Vector Search
    const relevantChunks = await retrieveRelevantChunks(doc._id, question, 4);

    if (!relevantChunks || relevantChunks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          answer: 'No relevant text could be found in the document to answer your question.',
          citations: [],
          question,
        },
      });
    }

    // 2. Pass retrieved context to Gemini for strictly grounded answering
    const qaResult = await answerDocumentQuestion(question, relevantChunks, doc.originalName);

    res.status(200).json({
      success: true,
      data: {
        question,
        answer: qaResult.answer,
        citations: qaResult.citations,
        retrievedChunkCount: relevantChunks.length,
      },
    });
  } catch (error) {
    console.error('❌ [Q&A Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process question with AI.',
    });
  }
};

module.exports = { askDocumentQuestion };
