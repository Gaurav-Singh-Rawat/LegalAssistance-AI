const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Extracts text and metadata from a PDF or DOCX file.
 * @param {string|Buffer} fileSource - Absolute path or in-memory file buffer.
 * @param {string} fileType - 'pdf' or 'docx'.
 * @returns {Promise<{text: string, pageCount: number, pages: Array<{pageNumber: number, text: string}>}>}
 */
const extractTextFromFile = async (fileSource, fileType) => {
  const ext = fileType ? fileType.toLowerCase() : path.extname(fileSource).toLowerCase().replace('.', '');

  if (ext === 'pdf') {
    const dataBuffer = Buffer.isBuffer(fileSource) ? fileSource : fs.readFileSync(fileSource);
    
    // Track per-page text if available
    const pages = [];
    const options = {
      pagerender: function (pageData) {
        return pageData.getTextContent().then(function (textContent) {
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY === item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          pages.push({
            pageNumber: pageData.pageIndex + 1,
            text: text.trim(),
          });
          return text;
        });
      },
    };

    const pdfData = await pdf(dataBuffer, options);
    
    return {
      text: pdfData.text,
      pageCount: pdfData.numpages || (pages.length > 0 ? pages.length : 1),
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: pdfData.text }],
    };
  }

  if (ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText(
      Buffer.isBuffer(fileSource) ? { buffer: fileSource } : { path: fileSource }
    );
    const fullText = result.value || '';
    
    // Estimate page count for DOCX (roughly 500 words / 3000 chars per standard legal page)
    const estimatedPages = Math.max(1, Math.ceil(fullText.length / 3000));
    
    return {
      text: fullText,
      pageCount: estimatedPages,
      pages: [{ pageNumber: 1, text: fullText }],
    };
  }

  throw new Error(`Unsupported file type: ${ext}. Only PDF and DOCX are supported.`);
};

module.exports = { extractTextFromFile };
