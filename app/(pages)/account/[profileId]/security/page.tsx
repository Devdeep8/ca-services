import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ChangePasswordForm from '@/components/profile-module/ChangePasswordForm'; // We will create this next
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  // It's good practice to ensure the user exists before rendering the page
  const user = await db.user.findUnique({
    where: { id: profileId },
    select: { id: true }, // We only need the ID to confirm existence
  });

  if (!user) {
    notFound();
  }

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      {/* Pass the profileId to the client form component */}
      <ChangePasswordForm profileId={profileId} />
    </Suspense>
  );
}