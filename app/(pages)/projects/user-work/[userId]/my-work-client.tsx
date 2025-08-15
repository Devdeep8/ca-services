'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, FolderKanban, Star, CircleHelp, List, UserCheck } from "lucide-react";
import Link from "next/link";
import { Task as PrismaTask } from '@prisma/client';

// --- Types to Match the NEW API Response ---
interface Task {
  id: string;
  title: string;
  status: PrismaTask['status'];
  projectId: string;
  workspaceId: string;
  project: {
    name: string;
    isClient: boolean;
  };
}

interface DepartmentGroup {
  departmentId: string;
  departmentName: string;
  tasks: Task[];
}

interface MyWorkData {
  user: {
    name: string;
  };
  stats: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
  allTasks: Task[];
  clientTasks: Task[];
  departmentProjectGroups: DepartmentGroup[];
}

// --- API Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Main Page Component ---
export default function MyWorkPage({ userId }: { userId: string }) {
  // --- CHANGE: Default active tab is now 'all' ---
  const [activeTab, setActiveTab] = useState<string>('all');

  // --- CHANGE: Updated the API endpoint URL ---
  const { data, error, isLoading } = useSWR<MyWorkData>(`/api/users/${userId}/my-work`, fetcher);

  // Effect to set a sensible initial tab if 'all' is empty
  useEffect(() => {
    if (data) {
      if (data.allTasks?.length > 0) {
        setActiveTab('all');
      } else if (data.clientTasks?.length > 0) {
        setActiveTab('client');
      } else if (data.departmentProjectGroups?.length > 0) {
        setActiveTab(data.departmentProjectGroups[0].departmentId);
      }
    }
  }, [data]);

  if (error) return <div>Failed to load your work dashboard. Please try again.</div>;
  if (isLoading || !data) return <PageLoader />;

  const { user, stats, allTasks, clientTasks, departmentProjectGroups } = data;
  
  // --- CHANGE: Filter out 'DONE' tasks for display in tables ---
  const filterDoneTasks = (tasks: Task[]) => tasks.filter(task => task.status !== 'DONE');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* --- Header --- */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{getGreeting()}! {user.name}</h1>
          <p className="text-muted-foreground">Here is your task summary.</p>
        </div>

        {/* --- Stats Cards (No changes needed, 'done' count is correct) --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tasks To Do" value={stats.todo} icon={<CircleHelp className="h-5 w-5 text-muted-foreground" />} />
          <StatCard title="In Progress" value={stats.inProgress} icon={<Clock className="h-5 w-5 text-blue-500" />} />
          <StatCard title="In Review" value={stats.review} icon={<Star className="h-5 w-5 text-yellow-500" />} />
          <StatCard title="Completed" value={stats.done} icon={<CheckCircle className="h-5 w-5 text-green-500" />} />
        </div>
        
        {/* --- Main Tasks Section --- */}
        <Card>
            <CardHeader>
                <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* --- CHANGE: Reworked Tabs for new data structure --- */}
                    <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-3 md:flex md:w-auto md:justify-start overflow-x-auto">
                        <TabsTrigger value="all">
                          <List className="mr-2 h-4 w-4" /> All Tasks
                        </TabsTrigger>
                        <TabsTrigger value="client">
                          <UserCheck className="mr-2 h-4 w-4" /> Client Tasks
                        </TabsTrigger>
                        {departmentProjectGroups.map(group => (
                          <TabsTrigger key={group.departmentId} value={group.departmentId}>
                            {group.departmentName}
                          </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {/* --- CHANGE: Reworked Tab Content for new data structure --- */}
                    <TabsContent value="all" className="mt-4">
                      <TaskTable tasks={filterDoneTasks(allTasks)} />
                    </TabsContent>
                    <TabsContent value="client" className="mt-4">
                      <TaskTable tasks={filterDoneTasks(clientTasks)} />
                    </TabsContent>
                    {departmentProjectGroups.map(group => (
                      <TabsContent key={group.departmentId} value={group.departmentId} className="mt-4">
                          <TaskTable tasks={filterDoneTasks(group.tasks)} />
                      </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}


// --- UI Sub-Components (No changes needed in these) ---
const TaskTable = ({ tasks }: { tasks: Task[] }) => {
    if (!tasks || tasks.length === 0) return <EmptyState />;
 
    const getStatusBadge = (status: PrismaTask['status']) => {
      switch (status) {
        case 'IN_PROGRESS':
          return <Badge className="text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20">In Progress</Badge>;
        case 'DONE':
          return <Badge className="text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20">Completed</Badge>;
        case 'TODO':
          return <Badge className="text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20">To Do</Badge>;
        case 'REVIEW':
            return <Badge className="text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20">In Review</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    };
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Task Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                  <Link href={`/projects/${task.projectId}?workspaceId=${task.workspaceId}`} className="group">
                      <p className="font-medium group-hover:underline">{task.title}</p>
                      <p className="text-sm text-muted-foreground group-hover:underline">Project: {task.project.name}</p>
                  </Link>
              </TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
};
 
const StatCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);
 
const EmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed rounded-lg">
      <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">No Active Tasks Here</h3>
      <p className="mt-1 text-sm text-muted-foreground">Looks like you're all caught up in this category!</p>
    </div>
);
 
const PageLoader = () => (
    <div className="container mx-auto p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
);