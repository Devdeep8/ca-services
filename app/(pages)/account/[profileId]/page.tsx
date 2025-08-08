import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import { db } from '@/lib/db';
export default async function ProfilePage({ params }: { params: { profileId: string } }) {
  const user = await db.user.findUnique({
    where: { id: params.profileId },
    include: {
      projectMemberships: {
        include: {
          project: true, // Include the full project details
        },
        orderBy: {
          project: {
            updatedAt: 'desc',
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>General user information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">System Role</span>
            <Badge variant="outline">{user.role}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Joined</span>
            <span className="font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>
            A list of projects this user is a member of.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {user.projectMemberships.length > 0 ? (
              user.projectMemberships.map(({ project, role }) => (
                <li key={project.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                  </div>
                  <Badge>{role}</Badge>
                </li>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">
                Not a member of any projects.
              </p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}