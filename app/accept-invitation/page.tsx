import { Suspense } from 'react';
import AcceptInvitationClient from './AcceptInvitationClient';

// This is a simple loading UI that will be shown initially.
// It can be a spinner or a skeleton screen.
function InvitationLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
            <h1 className="text-3xl font-bold">Loading Invitation...</h1>
            <p className="text-zinc-400 mt-2">Please wait a moment.</p>
        </div>
    );
}

export default function AcceptInvitationPage() {
  return (
    // The Suspense boundary wraps the dynamic component.
    // The `fallback` is what Next.js shows during the initial server render.
    <Suspense fallback={<InvitationLoading />}>
      <AcceptInvitationClient />
    </Suspense>
  );
}