import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '@/app/(pages)/account/[profileId]/settings/page'; // Note the updated import path
import { toast } from 'sonner';

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Data
const mockDepartments = [
  { id: 'dept-abc', name: 'Engineering' },
  { id: 'dept-xyz', name: 'Marketing' },
];
const mockUserProfile = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  departmentId: 'dept-abc', // User's current department is Engineering
};

describe('Page: SettingsPage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url, options) => {
      const urlString = url.toString();
      if (urlString.includes('/api/departments')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDepartments) });
      }
      if (urlString.includes('/api/profile')) {
        if ((options as RequestInit)?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUserProfile) });
      }
      return Promise.reject(new Error(`Unhandled fetch request: ${urlString}`));
    }) as jest.Mock;
  });

  it('should fetch data and pre-select the user\'s current department', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.queryByText('Loading settings...')).not.toBeInTheDocument();
    });
    // The department selector is a combobox, and "Engineering" should be visible as the selected value
    expect(screen.getByRole('combobox', { name: /department/i })).toBeInTheDocument();
    // Check that the combobox has the correct value by looking at the hidden select
    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
  });

  it('should allow the user to select a new department and save changes', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await waitFor(() => expect(screen.getByRole('combobox', { name: /department/i })).toBeInTheDocument());

    // Since Radix UI Select is complex in JSDOM, let's test the form submission directly
    // We can simulate the state change by finding the hidden select element and changing its value
    const hiddenSelect = screen.getByDisplayValue('Engineering');
    
    // Simulate changing the department selection
    await user.selectOptions(hiddenSelect, 'dept-xyz');
    
    // Click save button
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: 'dept-xyz' }),
      });
    });
    
    expect(toast.success).toHaveBeenCalledWith('Your department has been updated successfully.');
  });
});