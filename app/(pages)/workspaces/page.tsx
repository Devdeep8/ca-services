import { getWorkspacesForCurrentUser } from '@/actions/workspaces';
import Link from 'next/link';

// --- THE FIX ---
// This line tells Next.js to always render this page dynamically at request time.
// It will never try to build a static HTML file for this route.
export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
  // This server action uses getServerSession, which reads headers, making the page dynamic.
  const userWorkspaces = await getWorkspacesForCurrentUser();

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Your Workspaces</h1>
      
      {userWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userWorkspaces.map((workspace) => (
            <Link 
              href={`/workspaces/${workspace.id}/members`} 
              key={workspace.id}
              className="block p-6 bg-zinc-800 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              <h2 className="text-xl font-semibold">{workspace.name}</h2>
              <p className="text-sm text-zinc-400 mt-2">
                Created on: {new Date(workspace.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
          <p className="text-zinc-400">You are not a member of any workspaces yet.</p>
          <p className="text-zinc-500 text-sm mt-2">Create a new workspace or accept an invitation to get started.</p>
        </div>
      )}
    </div>
  );
}