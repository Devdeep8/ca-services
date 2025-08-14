"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { ProjectContext } from '@/context/project-context';
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  Package,
  BarChart3,
  FileText,
  Home,
  Building2,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, MobileHeader, type NavigationGroup, type Workspace } from "@/components/layout-module/app-sidebar";
import { Header } from "@/components/layout-module/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  // State for workspaces
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch workspaces on component mount
  useEffect(() => {
    async function fetchWorkspaces() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/workspaces");
        if (!res.ok) throw new Error("Failed to fetch workspaces");
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        setCurrentWorkspace(
          data.currentWorkspace ||
            (data.workspaces && data.workspaces[0]) ||
            null
        );
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchWorkspaces();
    }
  }, [status]);

  // Handler to switch workspace
  const handleSwitchWorkspace = async (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      try {
        await fetch("/api/user/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to switch workspace:", error);
      }
    }
  };

  // Handler for adding a new workspace
  const handleAddWorkspace = async (name: string) => {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      const data = await res.json();
      setWorkspaces((prev) => [...prev, data.workspace]);
      setCurrentWorkspace(data.workspace);
      router.refresh();
    } else {
      throw new Error("Failed to add workspace");
    }
  };

  // If session is loading, show a loader
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, show sign-in prompt
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card rounded-lg shadow-md border">
          <h1 className="text-2xl font-bold mb-4">
            Please sign in
          </h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access the dashboard.
          </p>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Define navigation groups with proper structure
  const navigationGroups: NavigationGroup[] = [
    
    {
      label: "Workspace",
      items: [
        {
          name: "Projects",
          href: "/projects",
          icon: FolderOpen,
          children: [
            {
              name: "All Projects",
              href: "/projects",
              icon: FolderOpen,
            },
            {
              name: "Assigend to Me",
              href: `/projects/user-work/${session?.user?.id}`,
              icon: FolderOpen,
            },
            // {
            //   name: "Assign to me",
            //   href: "/projects/my-task",
            //   icon: FolderOpen,
            // },
            // {
            //   name: "Archived",
            //   href: "/projects/archived",
            //   icon: FolderOpen,
            // },
          ],
        },
        {
          name: "Team",
          href: `/workspaces/${currentWorkspace?.id}/members`,
          icon: Users,
          children: [
            {
              name: "All Members",
              href: `/workspaces/${currentWorkspace?.id}/members`,
              icon: Users,
            },
            {
              name: "Invite Members",
              href: `/workspaces/${currentWorkspace?.id}/members`,
              icon: PlusCircle,
            },
          ],
        },
        // {
        //   name: "Analytics",
        //   href: "/analytics",
        //   icon: BarChart3,
        //   children: [
        //     {
        //       name: "Overview",
        //       href: "/analytics/overview",
        //       icon: BarChart3,
        //     },
        //     {
        //       name: "Reports",
        //       href: "/analytics/reports",
        //       icon: FileText,
        //     },
        //     {
        //       name: "Performance",
        //       href: "/analytics/performance",
        //       icon: BarChart3,
        //     },
        //   ],
        // },
      ],
    },
    {
      label: "Management",
      items: [
        {
          name: "Assets",
          href: "/assets",
          icon: Package,
          children: [
            {
              name: "All Assets",
              href: "/assets",
              icon: Package,
            },
            // {
            //   name: "Images",
            //   href: "/assets/images",
            //   icon: Package,
            // },
            // {
            //   name: "Documents",
            //   href: "/assets/documents",
            //   icon: FileText,
            // },
          ],
        },
        {
          name: "Workspaces",
          href: "/workspaces",
          icon: Building2,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          name: "Settings",
          href: `/account/${session?.user?.id}/settings`,
          icon: Settings,
          children: [
            {
              name: "Profile",
              href: `/account/${session?.user?.id}/settings/profile`,
              icon: Settings,
            },
            {
              name: "Security",
              href: `/account/${session?.user?.id}/settings/security`,
              icon: Settings,
            },
            // {
            //   name: "Billing",
            //   href: `/account/${session?.user?.id}/settings/billing`,
            //   icon: Settings,
            // },
          ],
        },
      ],
    },
  ];

  return (
    <ProjectContext.Provider
      value={{
        workspaceId: params.workspaceId as string,
        projectId: params.projectId as string,
      }}
    >
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          {/* Sidebar */}
          <AppSidebar
            navigationGroups={navigationGroups}
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onWorkspaceSwitch={handleSwitchWorkspace}
            onWorkspaceAdd={handleAddWorkspace}
            showWorkspaceSwitcher={true}
            variant="sidebar"
            collapsible="icon"
          />
          {/* <SidebarTrigger/> */}

          {/* Main Content */}
          <SidebarInset className="flex-1">
            {/* Mobile Header */}
            <MobileHeader />
            <Header session={session}/>

            {/* Page Content */}
            <main className="flex-1 p-4 lg:p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProjectContext.Provider>
  );
}
