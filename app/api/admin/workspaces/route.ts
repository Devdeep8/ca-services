import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ❗ Placeholder for your actual authentication logic
async function checkAdminAuth() {
  // TODO: Replace with your session validation
  console.log("Auth check passed (placeholder)");
}

// GET all workspaces
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();
    const workspaces = await db.workspace.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("GET Workspaces Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}