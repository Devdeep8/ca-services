// app/__tests__/integration/signup.integration.test.ts
import { NextRequest } from 'next/server';
import { POST as signupHandler } from '@/app/api/auth/sign-up/route';
import { db } from '@/lib/db';

describe('Signup API Integration', () => {
  beforeAll(async () => {
    // Delete only test users before running tests
    await db.user.deleteMany({
      where: {
        email: {
          contains: 'test+',
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test users after tests complete
    await db.user.deleteMany({
      where: {
        email: {
          contains: 'test+',
        },
      },
    });

    await db.$disconnect();
  });

  it('should create a user successfully', async () => {
    const body = {
      name: 'John Doe',
      email: 'test+john@example.com', // Use test+ prefix for test user emails
      password: 'password123',
    };

    const req = new NextRequest('http://localhost/api/signup', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await signupHandler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.user.email).toBe(body.email);

    // Check if user saved in DB
    const savedUser = await db.user.findUnique({
      where: { email: body.email },
    });
    expect(savedUser).not.toBeNull();
  });

  it('should fail if email already exists', async () => {
    const body = {
      name: 'John Doe',
      email: 'test+john@example.com', // Same test user email to cause conflict
      password: 'password123',
    };

    const req = new NextRequest('http://localhost/api/signup', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await signupHandler(req);
    expect(res.status).toBe(409);
  });
});
