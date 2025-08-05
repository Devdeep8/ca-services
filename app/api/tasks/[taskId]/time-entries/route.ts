import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createTimeEntrySchema = z.object({
    hours: z.number().positive(),
    date: z.string().datetime(),
});

export async function POST(request: NextRequest,  { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const { taskId } = await params;
        const body = await request.json();
        const validation = createTimeEntrySchema.safeParse(body);
        if(!validation.success) {
            return new NextResponse(JSON.stringify(validation.error.flatten()), { status: 400 });
        }

        const { hours, date } = validation.data;

        // Transaction to create time entry and update task's total hours
        const newTimeEntry = await db.$transaction(async (tx) => {
            const entry = await tx.timeEntry.create({
                data: {
                    taskId,
                    userId: session!.user.id,
                    hours: hours, // No need for new Decimal()
                    date: new Date(date),
                },
                include: {
                    user: { select: { id: true, name: true, avatar: true } }
                }
            });

            await tx.task.update({
                where: { id: taskId },
                data: {
                    actualHours: {
                        increment: hours // No need for new Decimal()
                    }
                }
            });

            return entry;
        });

        // The updated task object must be serialized before sending to the client
        const updatedTask = await db.task.findUnique({where: {id: taskId}})

        return NextResponse.json({newTimeEntry, actualHours: updatedTask?.actualHours}, { status: 201 });
    } catch (error) {
        console.error('[TIME_ENTRIES_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}