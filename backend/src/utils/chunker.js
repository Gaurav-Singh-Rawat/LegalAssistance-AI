/**
 * Smart Legal Document Chunker
 * Breaks down long legal documents into overlapping semantic chunks
 * while maintaining page and section references.
 */

/**
 * Splits text into overlapping chunks respecting sentence/paragraph boundaries
 * @param {Array<{pageNumber: number, text: string}>} pages
 * @param {number} chunkSize - Max characters per chunk (default 800)
 * @param {number} overlap - Overlapping character count (default 150)
 * @returns {Array<{chunkIndex: number, text: string, pageNumber: number, section: string}>}
 */
const chunkDocumentText = (pages, chunkSize = 800, overlap = 150) => {
  const chunks = [];
  let currentChunkIndex = 0;

  for (const page of pages) {
    const pageNumber = page.pageNumber;
    const cleanText = page.text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();

    if (!cleanText) continue;

    // Split text by paragraphs first
    const paragraphs = cleanText.split(/\n\s*\n/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) continue;

      if ((currentChunk + '\n\n' + trimmedPara).length <= chunkSize) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      } else {
        // If single paragraph is larger than chunkSize, split by sentences
        if (trimmedPara.length > chunkSize) {
          const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [trimmedPara];
          for (const sentence of sentences) {
            if ((currentChunk + ' ' + sentence).length <= chunkSize) {
              currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
            } else {
              if (currentChunk.trim()) {
                chunks.push({
                  chunkIndex: currentChunkIndex++,
                  text: currentChunk.trim(),
                  pageNumber,
                  section: detectSectionTitle(currentChunk),
                });
                // Keep overlap from end of current chunk
                const sliceStart = Math.max(0, currentChunk.length - overlap);
                currentChunk = currentChunk.slice(sliceStart).trim() + ' ' + sentence;
              } else {
                currentChunk = sentence;
              }
            }
          }
        } else {
          if (currentChunk.trim()) {
            chunks.push({
              chunkIndex: currentChunkIndex++,
              text: currentChunk.trim(),
              pageNumber,
              section: detectSectionTitle(currentChunk),
            });
            const sliceStart = Math.max(0, currentChunk.length - overlap);
            currentChunk = currentChunk.slice(sliceStart).trim() + '\n\n' + trimmedPara;
          } else {
            currentChunk = trimmedPara;
          }
        }
      }
    }

    // Push any remaining text from the page
    if (currentChunk.trim()) {
      chunks.push({
        chunkIndex: currentChunkIndex++,
        text: currentChunk.trim(),
        pageNumber,
        section: detectSectionTitle(currentChunk),
      });
    }
  }

  return chunks;
};

/**
 * Heuristic helper to detect clause/section headings like "Section 4. Termination" or "Article II: Confidentiality"
 */
const detectSectionTitle = (text) => {
  const headingMatch = text.match(/^(?:Section|Article|Clause|\d+\.|\b[A-Z\s]{4,}\b)[^\n:]+/im);
  if (headingMatch) {
    return headingMatch[0].trim().slice(0, 60);
  }
  return 'General Provisions';
};

module.exports = { chunkDocumentText };
