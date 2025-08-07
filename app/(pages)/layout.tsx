"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  LogOut,
  User,
  Plus,
  ChevronsUpDown,
  Check,
} from "lucide-react";

// UI Components (Assuming a shadcn/ui-like structure)
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton"; // For loading states
import { Header } from "@/components/layout-module/header";

// A helper to get user initials
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // State for workspaces
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for UI controls
  const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

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
        // Optionally set an error state to show in the UI
      } finally {
        setIsLoading(false);
      }
    }
    if (status === "authenticated") {
      fetchWorkspaces();
    }
  }, [status]);

  // Handler to switch workspace
  const handleSwitchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      // Here you would typically call an API to set the user's current workspace
      // For now, we'll just update state and refresh to simulate the change
      setIsSwitcherOpen(false);
      router.refresh();
    }
  };

  // Handler for adding a new workspace
  const handleAddWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newWorkspaceName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorkspaces((prev) => [...prev, data.workspace]);
        setCurrentWorkspace(data.workspace);
        setNewWorkspaceName("");
        setIsAddWorkspaceOpen(false);
        router.refresh();
      } else {
        // Handle error, e.g., show a toast notification
        console.error("Failed to add workspace");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If session is loading, show a loader
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  // If not authenticated, show sign-in prompt
  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Please sign in
          </h1>
          <p className="text-gray-600 mb-6">
            You need to be signed in to access the dashboard.
          </p>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Projects", href: "/projects", icon: FolderOpen },
    {
      name: "Team",
      href: `/workspaces/${
        workspaces.length > 0 ? workspaces[0].id : ""
      }/members`,
      icon: Users,
    },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <Sidebar>
          <SidebarHeader>
            {/* Workspace Switcher */}
            {isLoading ? (
              <div className="p-4">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Popover open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSwitcherOpen}
                    className="w-full justify-between"
                  >
                    {currentWorkspace
                      ? currentWorkspace.name
                      : "Select workspace..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search workspace..." />
                    <CommandList>
                      <CommandEmpty>No workspace found.</CommandEmpty>
                      <CommandGroup>
                        {workspaces.map((ws) => (
                          <CommandItem
                            key={ws.id}
                            onSelect={() => handleSwitchWorkspace(ws.id)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                currentWorkspace?.id === ws.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {ws.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    <CommandList>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setIsSwitcherOpen(false);
                            setIsAddWorkspaceOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          <span>Add Workspace</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <Link href={item.href} className="w-full">
                    <SidebarMenuButton isActive={pathname === item.href}>
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          {/* User info and sign out at the bottom */}
          <div className="p-4 border-t mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto px-2 py-2"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session.user?.image || ""}
                        alt={session.user?.name || "User"}
                      />
                      <AvatarFallback>
                        {getInitials(session.user?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Sidebar>

        {/* Main Content Area */}
        {/* <Header session={session} /> */}

         <div className="flex-1 flex flex-col overflow-hidden">
          <Header session={session}  />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      {/* </div> */}

      {/* Add Workspace Dialog */}
      <Dialog open={isAddWorkspaceOpen} onOpenChange={setIsAddWorkspaceOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Workspace</DialogTitle>
            <DialogDescription>
              Give your new workspace a name. You can change this later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddWorkspace}>
            <div className="grid gap-4 py-4">
              <input
                id="name"
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder="e.g., Marketing Team"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddWorkspaceOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !newWorkspaceName}
              >
                {isSubmitting ? "Adding..." : "Add Workspace"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
