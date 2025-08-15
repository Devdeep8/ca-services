import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Make sure this path is correct for your project structure
import { CreateProjectModal } from '@/components/modals/CreateProjectModal'; 
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    promise: jest.fn((promise, options) => {
        promise.then(options.success).catch(options.error);
    }),
  },
}));


// Mock fetch API
global.fetch = jest.fn();

const mockRouter = {
  refresh: jest.fn(),
};
(useRouter as jest.Mock).mockReturnValue(mockRouter);

const mockDepartments = [{ id: 'dept-1', name: 'Engineering' }];
// We need to mock clients as well, even if it's an empty array
const mockClients = [{ id: 'client-1', name: 'Global Tech Inc.' }];

describe('CreateProjectModal', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockRouter.refresh.mockClear();
  });

  it('should render the "New Project" button', () => {
    render(<CreateProjectModal workspaceId="ws-123" />);
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
  });

  it('should open the dialog and fetch initial data when the button is clicked', async () => {
    // Mock successful API responses for BOTH departments and clients
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => (mockDepartments) })
      .mockResolvedValueOnce({ ok: true, json: async () => (mockClients) });

    render(<CreateProjectModal workspaceId="ws-123" />);
    
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));

    // Assert that the dialog is now open
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByText('Select a department')).toBeInTheDocument();

    // Assert that fetch was called for BOTH endpoints
    expect(fetch).toHaveBeenCalledWith('/api/departments');
    expect(fetch).toHaveBeenCalledWith('/api/get/users?userType=CLIENT');
  });

  it('should submit the form with only project name and department', async () => {
    // FIX: Mock THREE fetch calls: departments, clients, and the final POST
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockDepartments }) // 1. GET departments
      .mockResolvedValueOnce({ ok: true, json: async () => mockClients })     // 2. GET clients
      .mockResolvedValueOnce({ ok: true, json: async () => ({ project: { id: 'proj-123', name: 'My Test Project' } }) }); // 3. POST success

    render(<CreateProjectModal workspaceId="ws-123" />);
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));

    // Fill out the form
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My Test Project' } });
    
    // Submit the form
    const createButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(createButton);

    // Wait for the submission to complete and check the fetch call payload
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'My Test Project',
          workspaceId: 'ws-123',
          departmentId: null,
          // isClient: false, 
          // clientId: null,
        }),
      });
    });

    // Check that the dialog closes after successful submission
    await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});