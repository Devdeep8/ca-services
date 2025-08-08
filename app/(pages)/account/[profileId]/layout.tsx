import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, Shield } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ profileId: string }>;
}) {
  const session = await getServerSession(authOptions); // Get the current logged-in user
  const { profileId } = await params;

  const user = await db.user.findUnique({
    where: { id: profileId },
  });

  if (!user) {
    notFound();
  }

  // Check if the logged-in user is viewing their own profile
  const isOwnProfile = session?.user?.id === profileId;
  const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || ''} alt={user.name} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                Role: <span className="font-semibold">{user.role}</span>
              </p>
            </div>
          </div>
          {isOwnProfile && (
            <Button asChild>
              <Link href={`/account/${profileId}/edit`}>Edit Profile</Link>
            </Button>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" asChild>
             <Link href={`/account/${profileId}`}><User className="w-4 h-4 mr-2" />Overview</Link>
          </TabsTrigger>
          {isOwnProfile && (
            <>
              <TabsTrigger value="settings" asChild>
                 <Link href={`/account/${profileId}/edit`}><Settings className="w-4 h-4 mr-2" />Settings</Link>
              </TabsTrigger>
              <TabsTrigger value="security" asChild>
                <Link href={`/account/${profileId}/security`}><Shield className="w-4 h-4 mr-2" />Security</Link>
              </TabsTrigger>
            </>
          )}
        </TabsList>
      </Tabs>
      
      <div>{children}</div>
    </div>
  );
}