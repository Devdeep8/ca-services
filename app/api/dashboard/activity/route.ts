import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }
    const user = await db.user.findUnique({ where: { email: session?.user?.email } });

    if (!user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get recent activity logs for user's projects
    const activities = await db.activityLog.findMany({
      where: {
        project: {
          OR: [
            { createdBy: user.id },
            { members: { some: { userId: user.id } } }
          ]
        }
      },
      include: {
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
      projectName: activity.project.name
    }))

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error('Error getting dashboard activity:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 