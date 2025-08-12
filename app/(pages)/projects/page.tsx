'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {  CoinsIcon, MoreHorizontal, MoreVertical, Pencil, Trash } from "lucide-react";
import { Plus, Briefcase, FolderKanban, LayoutGrid, List, User as UserIcon } from 'lucide-react'
import { CreateProjectModal } from '@/components/modals/CreateProjectModal'
import { Badge } from "@/components/ui/badge"

type ViewType = 'grid' | 'table';

interface UserInfo {
  name: string | null;
  avatar: string | null;
}

interface Project {
  status: string;
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  creator: UserInfo;
  lead: UserInfo;
}

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<ViewType>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedView = localStorage.getItem('projectView') as ViewType;
    if (savedView) {
      setView(savedView);
    }
  }, []);

useEffect(() => {
  if (status === 'loading') return;
  if (status === 'unauthenticated') {
    router.replace('/sign-in');
    return;
  }

  const checkOnboarding = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/onboarding/check');
      if (!res.ok) throw new Error('Failed to check workspace status.');
      const data = await res.json();
      if (!data.workspaceId) {
        router.replace('/onboarding');
      } else {
        setWorkspace({ id: data.workspaceId, name: data.workspaceName });
      }
    } catch (err) {
      setError('Could not verify your workspace. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'authenticated') {
    checkOnboarding();
  }
}, [status, router]); // ✅ Corrected dependency array

  useEffect(() => {
    if (!workspace) return;

    const fetchProjects = async () => {
      setIsProjectsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects?workspaceId=${workspace.id}`);
        if (!res.ok) throw new Error('Failed to fetch projects.');
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError('Failed to load projects. Please refresh the page.');
        console.error(err);
      } finally {
        setIsProjectsLoading(false);
      }
    };

    fetchProjects();
  }, [workspace]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
  };

  const handleSetView = (newView: ViewType) => {
    setView(newView);
    localStorage.setItem('projectView', newView);
  };

  // console.log(projects);

  if (isLoading) {
    return <DashboardLoader />;
  }

  console.log(workspace);
  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <h2 className="text-xl font-semibold">Loading Workspace...</h2>
          <p className="text-muted-foreground">{error || "Please wait or refresh the page."}</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={view} onValueChange={(value) => handleSetView(value as ViewType)} className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all projects for {workspace.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" />Grid</TabsTrigger>
            <TabsTrigger value="table"><List className="h-4 w-4 mr-2" />Table</TabsTrigger>
          </TabsList>
          <CreateProjectModal workspaceId={workspace.id} onProjectCreated={handleProjectCreated} />
        </div>
      </div>

      {isProjectsLoading ? (
        <>
          <TabsContent value="grid"><ProjectGridLoader /></TabsContent>
          <TabsContent value="table"><ProjectTableLoader /></TabsContent>
        </>
      ) : error ? (
        <ErrorState message={error} />
      ) : projects.length > 0 ? (
        <>
          <TabsContent value="grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => <ProjectCard key={project.id} project={project} workspaceId={workspace.id} />)}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <ProjectTable projects={projects} workspaceId={workspace.id} />
          </TabsContent>
        </>
      ) : (
        <EmptyState workspaceId={workspace.id} onProjectCreated={handleProjectCreated} />
      )}
    </Tabs>
  );
}

// --- Components ---


const ProjectCard = ({ project, workspaceId }: { project: Project; workspaceId: string }) => (

   <Link
      href={`/projects/${project.id}?workspaceId=${workspaceId}`}
      className="contents"
    >
      <Card className="hover:shadow-md transition-shadow flex flex-col cursor-pointer">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="font-semibold">{project.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={project.status === "ACTIVE" ? "success" : "secondary"}>
                {project.status}
              </Badge>
              {/* --- Dropdown Menu Start --- */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* We stop propagation here to prevent the Link from firing */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="h-8 w-8"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open project menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  // Stop propagation for the content as well
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DropdownMenuItem className='cursor-pointer' onClick={() => window.location.assign(`/projects/${project.id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                
                </DropdownMenuContent>
              </DropdownMenu>
              {/* --- Dropdown Menu End --- */}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span className="font-semibold">Lead:</span>
            <UserAvatar user={project.lead} />
            <span>{project.lead?.name || "N/A"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
);

const ProjectTable = ({ projects, workspaceId }: { projects: Project[]; workspaceId: string }) => {
  const router = useRouter();

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
            <TableHead className="text-right">Status</TableHead>
            <TableHead className='text-right'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map(project => (
            <TableRow
              key={project.id}
              className="cursor-pointer hover:bg-muted"
              onClick={() => router.push(`/projects/${project.id}?workspaceId=${workspaceId}`)}
            >
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <UserAvatar user={project.lead} />
                  <span className="font-medium">{project.lead?.name || "N/A"}</span>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {new Date(project.updatedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={project.status === "ACTIVE" ? "success" : "secondary"}>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                  <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* We stop propagation here to prevent the Link from firing */}
                  <Button

                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open project menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  // Stop propagation for the content as well
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.assign(`/projects/${project.id}/edit`)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                
                </DropdownMenuContent>
              </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

const UserAvatar = ({ user }: { user: UserInfo | null }) => {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  return (
    <Avatar className="h-6 w-6">
      <AvatarImage src={user?.avatar || undefined} alt={user?.name || ''} />
      <AvatarFallback>{initials || <UserIcon className="h-4 w-4" />}</AvatarFallback>
    </Avatar>
  );
};

const EmptyState = ({ workspaceId, onProjectCreated }: { workspaceId: string; onProjectCreated: (p: Project) => void }) => (
  <div className="text-center py-16 border-2 border-dashed rounded-lg">
    <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-4 text-lg font-medium">No projects found</h3>
    <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first project.</p>
    <div className="mt-6">
      <CreateProjectModal workspaceId={workspaceId} onProjectCreated={onProjectCreated} />
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <Card className="text-center p-8">
    <CardTitle className="text-red-500">An Error Occurred</CardTitle>
    <CardDescription>{message}</CardDescription>
    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
      Refresh Page
    </Button>
  </Card>
);

const DashboardLoader = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
    </div>
  </div>
);

const ProjectGridLoader = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
  </div>
);

const ProjectTableLoader = () => (
  <div className="space-y-2">
    <Skeleton className="h-12 w-full " />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);
