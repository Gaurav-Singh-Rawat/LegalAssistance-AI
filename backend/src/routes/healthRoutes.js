const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Legal AI Assistant Backend',
    database: dbStatus,
    geminiConfigured: hasGeminiKey,
  });
});

router.get('/test-gemini', async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not set in backend/.env' });
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    
    // Test the same current models used by the document analysis service.
    const testResults = {};
    const candidateNames = [
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-2.5-flash',
    ].filter(Boolean);

    for (const name of candidateNames) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent('Say "OK"');
        testResults[name] = { success: true, text: result.response.text().trim() };
      } catch (err) {
        testResults[name] = { success: false, error: err.message };
      }
    }

    res.json({
      keyPrefix: apiKey.trim().slice(0, 8) + '...',
      testResults,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

