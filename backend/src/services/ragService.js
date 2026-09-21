const mongoose = require('mongoose');
const DocumentChunk = require('../models/DocumentChunk');
const { generateEmbedding } = require('./geminiService');

/**
 * Searches for the most relevant document chunks given a user query.
 * Uses MongoDB Atlas Vector Search ($vectorSearch), with graceful keyword fallback.
 * @param {string} documentId - ObjectId of the document
 * @param {string} query - User question / search text
 * @param {number} topK - Number of top chunks to return (default 4)
 * @returns {Promise<Array<{text: string, pageNumber: number, section: string, score: number}>>}
 */
const retrieveRelevantChunks = async (documentId, query, topK = 4) => {
  const docObjectId = new mongoose.Types.ObjectId(documentId);

  try {
    // 1. Generate query vector embedding
    console.log(`🔍 [RAG Retrieval] Generating query embedding for: "${query.slice(0, 50)}..."`);
    const queryVector = await generateEmbedding(query);

    // 2. Perform Atlas Vector Search aggregation
    try {
      const vectorPipeline = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryVector,
            numCandidates: Math.max(topK * 5, 20),
            limit: topK,
            filter: {
              documentId: docObjectId,
            },
          },
        },
        {
          $project: {
            text: 1,
            pageNumber: 1,
            section: 1,
            chunkIndex: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ];

      const vectorResults = await DocumentChunk.aggregate(vectorPipeline);

      if (vectorResults && vectorResults.length > 0) {
        console.log(`🎯 [RAG Retrieval] Found ${vectorResults.length} chunks via Atlas Vector Search.`);
        return vectorResults;
      }
    } catch (vectorSearchErr) {
      console.warn(`⚠️ [RAG Retrieval] Atlas Vector Search query failed (Index may still be building): ${vectorSearchErr.message}`);
      console.warn(`ℹ️ [RAG Retrieval] Falling back to text matching across chunks...`);
    }

    // 3. Fallback: Keyword relevance search across document chunks
    console.log(`🔍 [RAG Retrieval] Running keyword/chunk search across document chunks...`);
    const allChunks = await DocumentChunk.find({ documentId: docObjectId }).sort({ chunkIndex: 1 });

    if (!allChunks || allChunks.length === 0) {
      return [];
    }

    // Score chunks by keyword match frequency
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    
    const scoredChunks = allChunks.map((chunk) => {
      const chunkTextLower = chunk.text.toLowerCase();
      let matchCount = 0;
      queryTerms.forEach((term) => {
        if (chunkTextLower.includes(term)) matchCount++;
      });
      return {
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        section: chunk.section,
        chunkIndex: chunk.chunkIndex,
        score: matchCount / (queryTerms.length || 1),
      };
    });

    // Sort by highest score first, return topK
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  } catch (error) {
    console.error('❌ [RAG Retrieval Error]:', error.message);
    throw new Error(`Failed to retrieve relevant chunks: ${error.message}`);
  }
};

module.exports = { retrieveRelevantChunks };
