import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import App from './App';

vi.mock('./services/api', () => ({
  checkHealth: vi.fn(async () => ({ status: 'online' })),
  fetchDocuments: vi.fn(async () => ({ success: true, data: [] })),
  deleteDocument: vi.fn(async () => ({ success: true })),
}));

describe('App', () => {
  it('renders the main upload call to action', async () => {
    render(<App />);

    expect(await screen.findByText(/Understand your legal documents\./i)).toBeInTheDocument();
    const uploadButtons = screen.getAllByRole('button', { name: /upload document/i });
    expect(uploadButtons.length).toBeGreaterThan(0);
  });
});
