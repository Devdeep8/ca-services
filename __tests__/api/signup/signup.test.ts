/**
 * signup.test.ts
 * Fixed version with proper mock order + valid test passwords
 */

// ------------------ MOCKS FIRST ------------------
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/utils/helper-server-function", () => ({
  getUserByEmail: jest.fn(),
}));

// ------------------ IMPORTS AFTER MOCKS ------------------
import bcrypt from "bcryptjs";
import { POST } from "@/app/api/auth/sign-up/route";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/utils/helper-server-function";
import {
  validateSignUpInput,
  hashPassword,
  createUser,
} from "@/components/auth-module/auth-helpers";
import { NextResponse } from "next/server";
import { success } from "zod";

// ------------------ TESTS ------------------
describe("validateSignUpInput", () => {
  it("should return parsed data if valid", () => {
    const data = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123", // min length 8
    };
    const result = validateSignUpInput(data);
    expect(result).toEqual(data);
  });

  it("should throw if invalid", () => {
    expect(() =>
      validateSignUpInput({
        name: "John Doe",
        email: "invalid-email",
        password: "password123",
        role: "user",
      })
    ).toThrow();
  });
});

describe("hashPassword", () => {
  it("should hash password using bcrypt", async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

    const result = await hashPassword("password123");

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
    expect(result).toBe("hashedPassword");
  });

  it("should throw an error if bcrypt fails", async () => {
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error("Bcrypt error"));

    await expect(hashPassword("password123")).rejects.toThrow("Bcrypt error");
  });
});

describe("createUser", () => {
  it("should create a new user", async () => {
    const userData = { name: "John", email: "john@example.com", password: "hashed" };
    (db.user.create as jest.Mock).mockResolvedValue(userData);

    const result = await createUser(userData);

    expect(db.user.create).toHaveBeenCalledWith({ data: userData });
    expect(result).toEqual(userData);
  });

  it("should throw an error if DB call fails", async () => {
    (db.user.create as jest.Mock).mockRejectedValue(new Error("DB error"));

    await expect(createUser({} as any)).rejects.toThrow("DB error");
  });
});

describe("POST /sign-up", () => {
  it("should return 409 if user already exists", async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue({ success: true, user: { id: 1 } });

    const req = {
      json: async () => ({
        name: "John",
        email: "john@example.com",
        password: "password123", // valid password
      }),
    } as any;

    const res = await POST(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(409);
  });

  it("should return 201 if user created successfully", async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue({ success: false });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    (db.user.create as jest.Mock).mockResolvedValue({ id: 1 });

    const req = {
      json: async () => ({
        name: "John",
        email: "john@example.com",
        password: "password123",
      }),
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it("should return 500 if DB call fails", async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    (db.user.create as jest.Mock).mockRejectedValue(new Error("DB failure"));

    const req = {
      json: async () => ({
        name: "John",
        email: "john@example.com",
        password: "password123",
      }),
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});
