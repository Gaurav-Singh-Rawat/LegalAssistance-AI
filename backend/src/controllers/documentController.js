const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const { uploadBuffer, deleteFile } = require('../utils/gridfs');
const { extractTextFromFile } = require('../utils/textExtractor');
const { chunkDocumentText } = require('../utils/chunker');
const { generateBatchEmbeddings, analyzeLegalDocument } = require('../services/geminiService');

/**
 * @desc    Upload a PDF or DOCX legal document, extract text, chunk it, embed it, and run Gemini legal analysis
 * @route   POST /api/documents/upload
 * @access  Public (Guest) / Protected
 */
const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a PDF or DOCX file.',
    });
  }

  const { originalname, buffer, mimetype, size } = req.file;
  const ext = path.extname(originalname).toLowerCase().replace('.', '');
  const fileType = ext === 'doc' ? 'docx' : ext;
  let storageId = null;
  let newDoc = null;

  try {
    // 1. Extract text and pages
    console.log(`📄 [Document Processing] Extracting text from: ${originalname}`);
    const extractionResult = await extractTextFromFile(buffer, fileType);

    if (!extractionResult.text || extractionResult.text.trim().length === 0) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract any readable text from this document. Please ensure it is not a scanned image.',
      });
    }

    // 2. Chunk text
    console.log(`🧩 [Document Processing] Chunking document text...`);
    const chunkData = chunkDocumentText(extractionResult.pages);

    // 3. Create the metadata record before storing the file so GridFS can reference it.
    newDoc = new Document({
      user: req.user?._id || null,
      originalName: originalname,
      fileName: originalname,
      fileType: fileType,
      fileSize: size,
      storageId: null,
      pageCount: extractionResult.pageCount || 1,
      status: 'processing',
    });
    await newDoc.save();

    storageId = await uploadBuffer({
      buffer,
      filename: `${newDoc._id}-${originalname}`,
      contentType: mimetype,
      metadata: {
        documentId: newDoc._id.toString(),
        userId: req.user?._id?.toString() || null,
      },
    });
    newDoc.storageId = storageId;
    await newDoc.save();

    // 4. Generate Embeddings & AI Analysis
    let embeddings = [];
    let legalAnalysis = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        console.log(`🧠 [AI Engine] Generating vector embeddings for ${chunkData.length} chunks...`);
        const chunkTexts = chunkData.map((c) => c.text);
        embeddings = await generateBatchEmbeddings(chunkTexts);

        console.log(`🤖 [AI Engine] Running full legal analysis on: ${originalname}...`);
        legalAnalysis = await analyzeLegalDocument(extractionResult.text, originalname);
      } catch (aiErr) {
        console.warn(`⚠️ [AI Engine Warning] AI generation failed, saving raw document: ${aiErr.message}`);
      }
    } else {
      console.warn('⚠️ [AI Engine] GEMINI_API_KEY not configured. Skipping automated AI analysis.');
    }

    // 5. Save Document Chunks with Embeddings in Database
    if (chunkData.length > 0) {
      const chunkRecords = chunkData.map((c, idx) => ({
        documentId: newDoc._id,
        chunkIndex: c.chunkIndex,
        text: c.text,
        pageNumber: c.pageNumber,
        section: c.section,
        embedding: embeddings[idx] || [],
      }));

      await DocumentChunk.insertMany(chunkRecords);
    }

    // 6. Update Document with Legal Analysis Results
    if (legalAnalysis) {
      newDoc.summary = legalAnalysis.summary || '';
      newDoc.keyClauses = legalAnalysis.keyClauses || [];
      newDoc.obligationsAndDeadlines = legalAnalysis.obligationsAndDeadlines || [];
      newDoc.risksAndRedFlags = legalAnalysis.risksAndRedFlags || [];
      newDoc.lawyerChecklist = legalAnalysis.lawyerChecklist || [];
      newDoc.status = 'completed';
    } else {
      newDoc.status = 'uploaded';
    }

    await newDoc.save();

    console.log(`✅ [Document Processing] Fully completed: ${originalname}`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed with AI successfully.',
      data: {
        id: newDoc._id,
        originalName: newDoc.originalName,
        fileType: newDoc.fileType,
        fileSize: newDoc.fileSize,
        pageCount: newDoc.pageCount,
        chunkCount: chunkData.length,
        status: newDoc.status,
        summary: newDoc.summary,
        keyClausesCount: newDoc.keyClauses?.length || 0,
        risksCount: newDoc.risksAndRedFlags?.length || 0,
        createdAt: newDoc.createdAt,
      },
    });
  } catch (error) {
    console.error(`❌ [Document Processing Error]:`, error);
    if (storageId) {
      try {
        await deleteFile(storageId);
      } catch (cleanupError) {
        console.error(`❌ [GridFS Cleanup Error]:`, cleanupError.message);
      }
    }
    if (newDoc?._id) {
      await DocumentChunk.deleteMany({ documentId: newDoc._id }).catch(() => {});
      await Document.findByIdAndDelete(newDoc._id).catch(() => {});
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process and analyze document.',
    });
  }
};

/**
 * @desc    Re-run AI analysis and vector embeddings on an existing uploaded document
 * @route   POST /api/documents/:id/reanalyze
 * @access  Public / Protected
 */
const reanalyzeDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (doc.user && (!req.user || doc.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You do not have access to this document.' });
    }

    const chunks = await DocumentChunk.find({ documentId: doc._id }).sort({ chunkIndex: 1 });
    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ success: false, message: 'No text chunks found for this document.' });
    }

    console.log(`🔄 [Re-Analysis] Re-analyzing document: ${doc.originalName}...`);

    // 1. Regenerate embeddings only when this document does not already have them.
    const chunkTexts = chunks.map((c) => c.text);
    const needsEmbeddings = chunks.some((chunk) => !Array.isArray(chunk.embedding) || chunk.embedding.length === 0);
    if (needsEmbeddings) {
      const embeddings = await generateBatchEmbeddings(chunkTexts);
      for (let i = 0; i < chunks.length; i++) {
        chunks[i].embedding = embeddings[i] || [];
        await chunks[i].save();
      }
    }

    // 2. Full text analysis with Gemini
    const fullText = chunkTexts.join('\n\n');
    const legalAnalysis = await analyzeLegalDocument(fullText, doc.originalName);

    doc.summary = legalAnalysis.summary || '';
    doc.keyClauses = legalAnalysis.keyClauses || [];
    doc.obligationsAndDeadlines = legalAnalysis.obligationsAndDeadlines || [];
    doc.risksAndRedFlags = legalAnalysis.risksAndRedFlags || [];
    doc.lawyerChecklist = legalAnalysis.lawyerChecklist || [];
    doc.status = 'completed';

    await doc.save();

    res.status(200).json({
      success: true,
      message: 'Document re-analyzed successfully with Gemini AI.',
      data: doc,
    });
  } catch (error) {
    console.error(`❌ [Re-Analysis Error]:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to re-analyze document with AI.',
    });
  }
};

/**
 * @desc    Get all uploaded documents
 * @route   GET /api/documents
 * @access  Public / Protected
 */
const getDocuments = async (req, res) => {
  try {
    const documents = req.user
      ? await Document.find({ user: req.user._id })
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(20)
      : [];

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch documents',
    });
  }
};

/**
 * @desc    Get a single document with full legal analysis
 * @route   GET /api/documents/:id
 * @access  Public / Protected
 */
const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (doc.user && (!req.user || doc.user.toString() !== req.user._id.toString())) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const chunkCount = await DocumentChunk.countDocuments({ documentId: doc._id });

    res.status(200).json({
      success: true,
      data: {
        ...doc.toObject(),
        chunkCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch document',
    });
  }
};

/**
 * @desc    Delete a document, its chunks, and the uploaded physical file
 * @route   DELETE /api/documents/:id
 * @access  Public / Protected
 */
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (doc.user && (!req.user || doc.user.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this document.',
      });
    }

    await deleteFile(doc.storageId);

    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await DocumentChunk.deleteMany({ documentId: doc._id });
    await Document.findByIdAndDelete(doc._id);

    res.status(200).json({
      success: true,
      message: 'Document and all associated chunks deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete document',
    });
  }
};

module.exports = {
  uploadDocument,
  reanalyzeDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
};
