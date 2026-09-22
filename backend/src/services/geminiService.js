const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let embeddingsUnavailable = false;

const getGenAIClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing in backend/.env. Please configure it to enable AI features.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Generates a 768-dimensional vector embedding for a given text snippet
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Float vector array
 */
const generateEmbedding = async (text) => {
  const cleanText = text.slice(0, 8000).replace(/\r\n/g, ' ').trim();
  if (!cleanText) {
    return new Array(768).fill(0);
  }

  if (embeddingsUnavailable) {
    return new Array(768).fill(0);
  }

  const client = getGenAIClient();

  // Use the current embedding model supported by the Gemini API.
  try {
    const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(cleanText);
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
  } catch (error) {
    embeddingsUnavailable = true;
    console.warn(`⚠️ [Embedding Warning] Embeddings unavailable; continuing without new embeddings: ${error.message}`);
  }

  return new Array(768).fill(0);
};

/**
 * Generates embeddings in batches to respect rate limits
 * @param {string[]} textArray
 * @returns {Promise<number[][]>}
 */
const generateBatchEmbeddings = async (textArray) => {
  const embeddings = [];
  for (let i = 0; i < textArray.length; i++) {
    const emb = await generateEmbedding(textArray[i]);
    embeddings.push(emb);
    // Small micro-pause to avoid rapid burst rate limits
    if (i % 5 === 0 && i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  return embeddings;
};

const CANDIDATE_GENERATIVE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
].filter(Boolean).filter((modelName, index, models) => models.indexOf(modelName) === index);

const isRetryableGeminiError = (error) => {
  const message = error?.message || '';
  return message.includes('[503') || /high demand|temporarily unavailable/i.test(message);
};

const isQuotaError = (error) => {
  const message = error?.message || '';
  return message.includes('[429') || /quota exceeded|quota limit|rate limit/i.test(message);
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Robust helper to generate content trying candidate model names
 */
const generateWithModelFallback = async (prompt, isJson = false) => {
  const client = getGenAIClient();
  let lastError = null;

  for (const modelName of CANDIDATE_GENERATIVE_MODELS) {
    try {
      const config = {
        temperature: isJson ? 0.2 : 0.1,
      };
      if (isJson) {
        config.responseMimeType = 'application/json';
      }

      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: config,
      });

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const result = await model.generateContent(prompt);
          if (result && result.response) {
            console.log(`✅ [Gemini AI] Successfully used model: ${modelName}`);
            return result.response.text();
          }
        } catch (err) {
          lastError = err;
          if (isQuotaError(err)) {
            console.warn(`⚠️ [Gemini Quota] Quota exceeded for model '${modelName}'. Stopping retries.`);
            break;
          }
          if (!isRetryableGeminiError(err) || attempt === 3) {
            break;
          }

          const delay = attempt * 1500;
          console.warn(`⚠️ [Gemini Retry] Model '${modelName}' is temporarily busy. Retrying in ${delay}ms...`);
          await wait(delay);
        }
      }
    } catch (err) {
      console.warn(`⚠️ [Model Fallback] Model '${modelName}' failed (${err.message}). Trying next candidate...`);
      lastError = err;
    }
  }

  throw new Error(`All candidate Gemini models failed. Last error: ${lastError?.message}`);
};

/**
 * Performs comprehensive legal analysis on a document
 * Extracts summary, key clauses, obligations, risks, and lawyer checklist
 * @param {string} documentText
 * @param {string} documentName
 * @returns {Promise<Object>}
 */
const analyzeLegalDocument = async (documentText, documentName = 'Document') => {
  try {
    const truncatedText = documentText.slice(0, 45000); // Fits safely inside prompt window

    const prompt = `
You are an expert Legal Information and Document Assistance AI.
Analyze the following legal agreement/document ("${documentName}").

IMPORTANT GUIDELINES:
- Provide legal information and objective analysis, NOT legal advice.
- Simplify complex legal jargon into clear, plain English that a layperson can easily understand.
- Ground all findings strictly in the provided document text.
- Return ONLY a valid JSON object matching the exact structure below. Do not wrap in markdown or backticks.

Document Content:
"""
${truncatedText}
"""

Required JSON output structure:
{
  "summary": "A 3-5 sentence plain-English executive summary explaining the primary purpose, parties involved, and overall nature of this agreement.",
  "keyClauses": [
    {
      "title": "Clause name (e.g. Confidentiality, Termination, Payment Terms, Non-Compete)",
      "originalSnippet": "Exact brief excerpt from the document",
      "simplifiedExplanation": "Clear plain-English translation of what this clause means for the user",
      "importance": "high"
    }
  ],
  "obligationsAndDeadlines": [
    {
      "description": "What specific obligation or action must be performed",
      "party": "Who is responsible (e.g. Employee, Tenant, Contractor, Both)",
      "deadline": "Timeframe or specific date (or 'Ongoing')",
      "consequence": "Consequence or penalty if breached"
    }
  ],
  "risksAndRedFlags": [
    {
      "title": "Name of the risk (e.g., Automatic Renewal, Broad Indemnification, Ambiguous Termination)",
      "description": "Why this clause or condition poses a potential risk, liability, or disadvantage",
      "severity": "high",
      "recommendation": "What the user should pay close attention to or clarify"
    }
  ],
  "lawyerChecklist": [
    {
      "question": "Specific, practical question to ask an attorney before signing",
      "context": "Why this question is important based on the document's terms",
      "category": "e.g. Liability, Termination, Payment, IP Rights"
    }
  ]
}
`;

    console.log(`🤖 [Gemini AI] Running comprehensive legal analysis on: ${documentName}...`);
    let responseText = await generateWithModelFallback(prompt, true);
    responseText = responseText.trim();

    // Strip markdown code fences if present (e.g. ```json ... ```)
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const analysis = JSON.parse(responseText);
    return analysis;
  } catch (error) {
    console.error('❌ [Gemini Document Analysis Error]:', error.message);
    if (isQuotaError(error)) {
      throw new Error('Gemini API quota exceeded. Wait for the quota to reset or enable billing/use another API key.');
    }
    throw new Error(`Gemini legal analysis failed: ${error.message}`);
  }
};

/**
 * Answers questions grounded strictly in retrieved context chunks
 * @param {string} question
 * @param {Array<{text: string, pageNumber: number, section: string}>} contextChunks
 * @param {string} documentName
 * @returns {Promise<{answer: string, citations: Array<{pageNumber: number, section: string, snippet: string}>}>}
 */
const answerDocumentQuestion = async (question, contextChunks, documentName = 'Document') => {
  try {
    const formattedContext = contextChunks
      .map((c, i) => `[Source Chunk ${i + 1} | Page ${c.pageNumber || 1} | Section: ${c.section || 'General'}]\n${c.text}`)
      .join('\n\n---\n\n');

    const prompt = `
You are LexiAssist, a specialized GenAI Legal Information Assistant.
You are helping a user understand their uploaded legal document ("${documentName}").

CRITICAL INSTRUCTIONS:
1. Answer the user's question based STRICTLY and ONLY on the document context provided below.
2. Cite the specific Source Chunk, Page number, and Section whenever you reference a fact or term.
3. If the answer CANNOT be found in the provided context, state clearly and politely: "I cannot find this information in the uploaded document. Please check if this topic is covered in another section or consult a legal professional."
4. Do NOT hallucinate, assume, or invent legal provisions, terms, or penalties that are not in the text.
5. Provide helpful legal information, but clearly remind the user where appropriate that you are an AI assistant and this is not formal legal advice.
6. Format your answer with clean Markdown (bullet points, bold highlights) for readability.

Document Context Chunks:
"""
${formattedContext}
"""

User Question:
"${question}"

Provide a thorough, grounded, and clear answer:
`;

    console.log(`🤖 [Gemini AI] Generating grounded answer for question: "${question.slice(0, 50)}..."`);
    const answer = await generateWithModelFallback(prompt, false);

    // Map source citations for frontend badges
    const citations = contextChunks.map((c) => ({
      pageNumber: c.pageNumber || 1,
      section: c.section || 'General',
      snippet: c.text.slice(0, 160) + '...',
    }));

    return {
      answer,
      citations,
    };
  } catch (error) {
    console.error('❌ [Gemini Q&A Error]:', error.message);
    throw new Error(`Gemini Q&A generation failed: ${error.message}`);
  }
};

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  analyzeLegalDocument,
  answerDocumentQuestion,
};
