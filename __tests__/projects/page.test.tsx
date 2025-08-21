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
      // Ensure the promise resolves for testing success paths
      return promise.then(options.success).catch(options.error);
    }),
  },
}));

// Mock the nested AddInternalProductModal to isolate the component under test
jest.mock("@/components/modals/AddInternalProductModal", () => ({
    // The path to AddInternalProductModal might need adjustment
    AddInternalProductModal: () => <button>Add Product</button>,
}));


// Mock fetch API
global.fetch = jest.fn();

const mockRouter = {
  refresh: jest.fn(),
};
(useRouter as jest.Mock).mockReturnValue(mockRouter);

// Mock data for all API calls
const mockDepartments = [{ id: "dept-1", name: "Engineering" }];
const mockClients = [{ id: "client-1", name: "Global Tech Inc." }];
const mockInternalProducts = [{ id: "prod-1", name: "Project Phoenix" }];

// Helper function to generate unique project names
const generateUniqueProjectName = () => {
  return `Test Project ${Date.now()}`;
};

// Helper function to select an option from a ShadCN/Radix Select dropdown
const selectFromDropdown = async (triggerText: string, optionText: string) => {
  fireEvent.click(screen.getByText(triggerText));
  const option = await screen.findByRole('option', { name: optionText });
  fireEvent.click(option);
};


describe("CreateProjectModal", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockRouter.refresh.mockClear();
    (jest.requireMock("sonner").toast.error as jest.Mock).mockClear();

    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === "/api/departments") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDepartments),
        });
      }
      if (url === "/api/get/users?userType=CLIENT") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockClients),
        });
      }
      if (url === "/api/internal-products") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInternalProducts),
        });
      }
      if (url === "/api/projects") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: { id: "proj-123", name: "New Project" } }),
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });
  });

  it('should render the "New Project" button', () => {
    render(<CreateProjectModal workspaceId="ws-123" />);
    expect(
      screen.getByRole("button", { name: /new project/i })
    ).toBeInTheDocument();
  });

  it("should open the dialog and fetch all initial data when the button is clicked", async () => {
    render(<CreateProjectModal workspaceId="ws-123" />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByText("Select a product")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/departments");
      expect(fetch).toHaveBeenCalledWith("/api/get/users?userType=CLIENT");
      expect(fetch).toHaveBeenCalledWith("/api/internal-products");
    });
  });

  it("should submit the form for an INTERNAL project by default", async () => {
    const uniqueProjectName = generateUniqueProjectName();

    render(<CreateProjectModal workspaceId="ws-123" />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    await screen.findByRole("dialog");

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: uniqueProjectName },
    });

    await selectFromDropdown("Select a department", "Engineering");
    await selectFromDropdown("Select a product", "Project Phoenix");
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uniqueProjectName,
          workspaceId: "ws-123",
          departmentId: "dept-1",
          isClientProject: false,
          clientId: null,
          internalProductId: "prod-1",
        }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should submit the form for a CLIENT project when toggled", async () => {
    const uniqueProjectName = generateUniqueProjectName();

    render(<CreateProjectModal workspaceId="ws-123" />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    await screen.findByRole("dialog");

    const clientSwitch = screen.getByLabelText(/External Client Project/i);
    fireEvent.click(clientSwitch);

    expect(await screen.findByText("Select a client")).toBeInTheDocument();
    expect(screen.queryByText("Select a product")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: uniqueProjectName },
    });

    await selectFromDropdown("Select a department", "Engineering");
    await selectFromDropdown("Select a client", "Global Tech Inc.");
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uniqueProjectName,
          workspaceId: "ws-123",
          departmentId: "dept-1",
          isClientProject: true,
          clientId: "client-1",
          internalProductId: null,
        }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should show validation error if required fields are missing", async () => {
    render(<CreateProjectModal workspaceId="ws-123" />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    await screen.findByRole("dialog");

    const submitButton = screen.getByRole("button", { name: /create project/i });
    const clientSwitch = screen.getByLabelText(/External Client Project/i);

    // --- FIX: Add project name to test subsequent validations ---
    // The component checks for a name first, so we must provide one.
    fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: "Test Validation Project" },
    });

    // Case 1: No department selected
    fireEvent.click(submitButton);
    await waitFor(() => {
       expect(jest.requireMock("sonner").toast.error).toHaveBeenCalledWith("Please select a department for this project.");
    });

    // Select a department to proceed
    await selectFromDropdown("Select a department", "Engineering");

    // Case 2: No internal product selected (default)
    fireEvent.click(submitButton);
     await waitFor(() => {
       expect(jest.requireMock("sonner").toast.error).toHaveBeenCalledWith("Please select an internal product.");
    });
   
    // Case 3: No client selected (after toggling switch)
    fireEvent.click(clientSwitch);
    await screen.findByText("Select a client"); // Wait for UI update
    fireEvent.click(submitButton);
     await waitFor(() => {
       expect(jest.requireMock("sonner").toast.error).toHaveBeenCalledWith("Please select an external client.");
    });
  });
});