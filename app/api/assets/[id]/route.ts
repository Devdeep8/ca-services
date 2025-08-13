// app/api/assets/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// GET handler to fetch a single asset by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const {id} = await params
  try {
    const asset = await db.asset.findUnique({
      where: { id: id },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

// // PATCH handler to update an asset
// export async function PATCH(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//       const { id } = await params;
      
//       const body = await request.json();
//     const updatedAsset = await db.asset.update({
//       where: { id: id },
//     //   body,
//     });

//     return NextResponse.json(updatedAsset);
//   } catch (error) {
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ error: error.issues }, { status: 400 });
//     }
//     return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
//   }
// }

// DELETE handler to remove an asset
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.asset.delete({
      where: { id:id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}