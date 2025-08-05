import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty."),
});

export async function POST(request: NextRequest,  { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        const { taskId } = await params;
        const body = await request.json();
        const validation = createCommentSchema.safeParse(body);
        if(!validation.success) {
            return new NextResponse(JSON.stringify(validation.error.flatten()), { status: 400 });
        }

        // Authorization check can be added here as well

        const newComment = await db.taskComment.create({
            data: {
                taskId: taskId,
                userId: session.user.id,
                content: validation.data.content,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } }
            }
        });

        return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
        console.error('[COMMENTS_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}