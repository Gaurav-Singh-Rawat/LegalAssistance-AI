/**
 * API Service Client
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getToken = () => localStorage.getItem('lexi_token');

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerUser = async ({ name, email, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create account');
  return data;
};

export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to sign in');
  return data;
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check returned status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to reach backend API:', error);
    return { status: 'offline', error: error.message };
  }
};

/**
 * Upload a PDF or DOCX legal document
 * @param {File} file
 * @returns {Promise<any>}
 */
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload document');
  }
  return data;
};

/**
 * Fetch list of all uploaded documents
 */
export const fetchDocuments = async () => {
  const response = await fetch(`${API_BASE_URL}/documents`, { headers: authHeaders() });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch documents');
  }
  return data;
};

/**
 * Fetch document details by ID
 */
export const fetchDocumentById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, { headers: authHeaders() });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch document');
  }
  return data;
};

/**
 * Ask a question about a document using Grounded RAG + Gemini
 * @param {string} documentId
 * @param {string} question
 */
export const askDocumentQuestion = async (documentId, question) => {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ question }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to get answer from AI');
  }
  return data;
};

/**
 * Re-run AI analysis on an existing document
 * @param {string} documentId
 */
export const reanalyzeDocument = async (documentId) => {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/reanalyze`, {
    method: 'POST',
    headers: authHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to re-analyze document');
  }
  return data;
};

/**
 * Delete document by ID
 */
export const deleteDocument = async (id) => {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete document');
  }
  return data;
};
