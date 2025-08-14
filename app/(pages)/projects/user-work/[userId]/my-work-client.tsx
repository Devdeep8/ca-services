'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, Plus, Share, CheckCircle, Clock, FolderKanban } from "lucide-react";
import Link from "next/link";

// --- Types (for better code quality) ---
interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  projectId: string;
  workspaceId: string;
  project: { name: string };
  departmentId?: string; // Optional department ID on the task
}
interface Department {
  id: string;
  name: string;
}
interface User {
  name: string;
  avatar?: string;
}

// --- API Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Main Page Component ---
export default function MyWorkPage({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState('all');

  // --- Data Fetching ---
  const { data: user, error: userError } = useSWR<User>(`/api/users/${userId}`, fetcher);
  const { data: departments, error: departmentsError } = useSWR<Department[]>('/api/departments', fetcher);
  // Fetch all tasks at once to calculate stats and filter on the client
  const { data: allTasks, error: tasksError } = useSWR<Task[]>(`/api/users/${userId}/my-work/all-tasks`, fetcher);

  console.log(allTasks , user , departments , "form the code ")
  // --- Derived State for Filtering ---
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    if (activeTab === 'all') return allTasks;
    if (activeTab === 'client') {
        // Assuming client tasks don't have a departmentId
        return allTasks.filter(task => !task.departmentId);
    }
    return allTasks.filter(task => task.departmentId === activeTab);
  }, [allTasks, activeTab]);
  
  // --- Loading and Error States ---
  if (userError || departmentsError || tasksError) return <div>Failed to load dashboard.</div>;
  if (!user || !departments || !allTasks) return <PageLoader />;

  // --- Calculated Stats for Header ---
  const stats = {
    inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
    completedThisWeek: allTasks.filter(t => t.status === 'DONE').length, // Simplified for example
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }

  return (
    <div className=" min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{getGreeting()}! {user.name}</h1>
            <p className="text-gray-500">Let's see what you've got on your plate today.</p>
          </div>
          {/* <div className="flex items-center space-x-2">
            <Button variant="outline" className="text-gray-700">
              <Share className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div> */}
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tasks In Progress" value={stats.inProgress} icon={<Clock className="h-5 w-5 text-blue-500" />} />
          <StatCard title="Completed This Week" value={stats.completedThisWeek} icon={<CheckCircle className="h-5 w-5 text-green-500" />} />
          {/* Add other stats cards as needed */}
        </div>
        
        {/* --- Main Tasks Section --- */}
        <Card>
            <CardHeader>
                <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="client">Client Projects</TabsTrigger>
                        {departments.map((dept) => (
                          <TabsTrigger key={dept.id} value={dept.id}>{dept.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {/* Render a single content area and pass filtered tasks */}
                    <TabsContent value={activeTab} className="mt-4">
                        <TaskTable tasks={filteredTasks} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

// --- UI Sub-Components ---

const TaskTable = ({ tasks }: { tasks: Task[] }) => {
  if (tasks.length === 0) return <EmptyState />;

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'DONE':
        return <Badge variant={"success"} >Completed</Badge>;
      case 'TODO':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">To Do</Badge>;
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
                    <p className="font-medium text-gray-800 group-hover:text-primary">{task.title}</p>
                    <p className="text-sm text-gray-500 group-hover:text-primary/80">Project: {task.project.name}</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const EmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed rounded-lg">
      <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-800">No Tasks Here</h3>
      <p className="mt-1 text-sm text-gray-500">Looks like you're all caught up in this category!</p>
    </div>
);

const PageLoader = () => (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
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