/**
 * @jest-environment node
 */
import { POST } from "@/app/api/projects/route";
import { NextRequest } from "next/server";
import { ProjectCreationError } from "@/utils/errors";

// --- Mocks ---
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/utils/helper-server-function", () => ({
  getUserByEmail: jest.fn(),
}));

// Mock the service layer and re-export the actual error class
jest.mock("@/services/project-service/create-project.service", () => {
  const { ProjectCreationError: OriginalError } =
    jest.requireActual("@/utils/errors");
  return {
    createProjectInDb: jest.fn(),
    ProjectCreationError: OriginalError,
  };
});

// --- Type-Safe Mock Variables ---
const mockedGetSession = require("next-auth/next")
  .getServerSession as jest.Mock;
const mockedGetUser = require("@/utils/helper-server-function")
  .getUserByEmail as jest.Mock;
const mockedCreateProjectInDb =
  require("@/services/project-service/create-project.service")
    .createProjectInDb as jest.Mock;

// --- Test Suite ---
describe("/api/projects POST", () => {
  const mockUser = { user: { id: "user-123", email: "test@example.com" } };

  const baseInternalPayload = {
    name: "New Internal Project",
    workspaceId: "ws-123",
    departmentId: "dept-1",
    isClientProject: false,
    internalProductId: "prod-abc",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSession.mockResolvedValue({ user: { email: "test@example.com" } });
    mockedGetUser.mockResolvedValue(mockUser);
  });

  // --- Success Cases ---
  it("should call the service with correct data and a generated due date, returning 201 on success", async () => {
    const createdProject = { id: "proj-1", name: baseInternalPayload.name };
    mockedCreateProjectInDb.mockResolvedValue({ project: createdProject });

    const req = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(baseInternalPayload),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.project).toEqual(createdProject);

    // --- FIX: Verify that the service is called with a calculated dueDate ---
    expect(mockedCreateProjectInDb).toHaveBeenCalledWith(
      expect.objectContaining({
        ...baseInternalPayload,
        userId: mockUser.user.id,
        dueDate: expect.any(Date), // Ensures the API handler added a due date
      })
    );
  });

  // --- Auth & Authorization Errors ---
  it("should return 401 Unauthorized if no session is found", async () => {
    mockedGetSession.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(baseInternalPayload),
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  // --- Validation & Service Errors ---
  it("should return 400 for an invalid request body (Zod error)", async () => {
    const invalidPayload = { workspaceId: "ws-123" }; // Missing required fields
    const req = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);

    // --- FIX: Use the most reliable Array check ---
    expect(Array.isArray(body.error)).toBe(true);

    // This line can now safely access the array
    expect(body.error[0].path).toContain("name");
  });

  it("should return 400 when the service throws a ProjectCreationError", async () => {
    const errorMessage = "Project already exists.";
    mockedCreateProjectInDb.mockRejectedValue(
      new ProjectCreationError(errorMessage)
    );

    const req = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(baseInternalPayload),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(errorMessage);
  });

  // --- General & Server Errors ---
  it("should return 500 for an unexpected error from the service", async () => {
    mockedCreateProjectInDb.mockRejectedValue(
      new Error("Something went wrong")
    );

    const req = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify(baseInternalPayload),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal Server Error");
  });
});
