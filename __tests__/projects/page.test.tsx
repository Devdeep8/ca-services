import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
// Make sure this path is correct for your project structure
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { useRouter } from "next/navigation";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
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

const mockDepartments = [{ id: "dept-1", name: "Engineering" }];
// We need to mock clients as well, even if it's an empty array
const mockClients = [{ id: "client-1", name: "Global Tech Inc." }];

// Helper function to generate unique project names
const generateUniqueProjectName = () => {
  return `Test Project ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

describe("CreateProjectModal", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockRouter.refresh.mockClear();
  });

  it('should render the "New Project" button', () => {
    render(<CreateProjectModal workspaceId="ws-123" />);
    expect(
      screen.getByRole("button", { name: /new project/i })
    ).toBeInTheDocument();
  });

  it("should open the dialog and fetch initial data when the button is clicked", async () => {
    // Mock successful API responses for BOTH departments and clients
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockDepartments })
      .mockResolvedValueOnce({ ok: true, json: async () => mockClients });

    render(<CreateProjectModal workspaceId="ws-123" />);

    fireEvent.click(screen.getByRole("button", { name: /new project/i }));

    // Assert that the dialog is now open
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByText("Select a department")).toBeInTheDocument();

    // Assert that fetch was called for BOTH endpoints
    expect(fetch).toHaveBeenCalledWith("/api/departments");
    expect(fetch).toHaveBeenCalledWith("/api/get/users?userType=CLIENT");
  });

  it("should submit the form with only project name and department", async () => {
    const uniqueProjectName = generateUniqueProjectName();
    
    // Mock the 3 fetch calls
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockDepartments }) // 1. GET departments
      .mockResolvedValueOnce({ ok: true, json: async () => mockClients }) // 2. GET clients
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          project: { id: "proj-123", name: uniqueProjectName },
        }),
      }); // 3. POST success → mock it instead of real DB

    render(<CreateProjectModal workspaceId="ws-123" />);

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));

    // Wait for modal to open and data to load
    await screen.findByRole("dialog");

    // Wait for the select to be populated (departments loaded)
    await waitFor(() => {
      expect(screen.getByText("Select a department")).toBeInTheDocument();
    });

    // Fill project name with unique name
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: uniqueProjectName },
    });

    // Select department - find the select trigger
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);

    // Wait for the dropdown options to appear and click on Engineering
    // Use getAllByText to handle multiple elements and select the clickable one
    await waitFor(() => {
      const engineeringOptions = screen.getAllByText("Engineering");
      // Find the option that's clickable (not aria-hidden)
      const clickableOption = engineeringOptions.find(option => 
        !option.closest('[aria-hidden="true"]')
      );
      if (clickableOption) {
        fireEvent.click(clickableOption);
      } else {
        // Fallback: click the first option
        fireEvent.click(engineeringOptions[0]);
      }
    });

    // Submit form
    const createButton = screen.getByRole("button", {
      name: /create project/i,
    });
    fireEvent.click(createButton);

    // Assert POST payload
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uniqueProjectName,
          workspaceId: "ws-123",
          departmentId: "dept-1",
        }),
      });
    });

    // Ensure modal closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});