const mongoose = require('mongoose');

const clauseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalSnippet: { type: String },
  simplifiedExplanation: { type: String, required: true },
  importance: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  pageNumber: { type: Number },
  section: { type: String },
});

const obligationSchema = new mongoose.Schema({
  description: { type: String, required: true },
  party: { type: String, default: 'Unspecified' },
  deadline: { type: String, default: 'None specified' },
  consequence: { type: String },
});

const riskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  recommendation: { type: String },
});

const checklistItemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  context: { type: String },
  category: { type: String, default: 'General Legal Inquiry' },
});

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Allows guest/unauthenticated uploads during early testing
    },
    originalName: {
      type: String,
      required: [true, 'Original document name is required'],
    },
    fileName: {
      type: String,
      required: [true, 'Stored file name is required'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: false,
    },
    storageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },
    errorMessage: {
      type: String,
    },
    summary: {
      type: String, // Plain-language simplified executive summary
    },
    keyClauses: [clauseSchema],
    obligationsAndDeadlines: [obligationSchema],
    risksAndRedFlags: [riskSchema],
    lawyerChecklist: [checklistItemSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', documentSchema);
