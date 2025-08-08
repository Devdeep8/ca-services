import EditProfileForm from '@/components/profile-module/EditProfileForm'; // We will create this next
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// This is now a Server Component, so it can be async
export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  // 1. Await the promise here to get the resolved value
  const { profileId } = await params;

  return (
    // It's good practice to wrap data-dependent components in Suspense
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      {/* 2. Pass the resolved profileId as a normal string prop */}
      <EditProfileForm profileId={profileId} />
    </Suspense>
  );
}