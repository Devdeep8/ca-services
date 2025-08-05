'use client';

import { useEffect, useState, useMemo } from 'react';
import { type Task, type ProjectMember, type User, type Project, TaskStatus } from '@prisma/client';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { KanbanColumn } from './kanban-column';
import { SortableTaskCard } from './sortable-task-card';
import { ProjectTable } from './project-table';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ProjectContext } from '@/context/project-context'; // <-- Import the context

const BOARD_COLUMNS = [
  { title: 'To Do', status: TaskStatus.TODO },
  { title: 'In Progress', status: TaskStatus.IN_PROGRESS },
  { title: 'In Review', status: TaskStatus.REVIEW },
  { title: 'Done', status: TaskStatus.DONE },
];

type TaskWithAssignee = Task & { assignee: { id: string; name: string | null; avatar: string | null } | null };
type MemberWithUser = ProjectMember & { user: User };
type BoardData = Project & { tasks: TaskWithAssignee[]; members: MemberWithUser[] };

interface ProjectBoardProps {
  projectId: string;
  currentUserId: string;
}

export default function ProjectBoard({ projectId, currentUserId }: ProjectBoardProps) {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  const fetchBoardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/board-data`);
      if (!response.ok) throw new Error('Failed to fetch board data');
      const data: BoardData = await response.json();
      setBoardData(data);
    } catch (error) {
      console.error(error);
      setBoardData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if(projectId) fetchBoardData();
  }, [projectId]);

  const tasksByStatus = useMemo(() => {
    const initial: Record<TaskStatus, TaskWithAssignee[]> = {
      TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [],
    };
    if (!boardData) return initial;
    
    // Create a new copy to avoid mutation issues
    const grouped = { ...initial };
    boardData.tasks.forEach(task => {
        if (grouped[task.status]) {
            grouped[task.status].push(task);
        }
    });
    return grouped;
  }, [boardData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    if (!isActiveATask) return;

    setBoardData((board) => {
        if (!board) return null;
        const newTasks = [...board.tasks];
        const activeTaskIndex = newTasks.findIndex((t) => t.id === activeId);
        
        const isOverATask = over.data.current?.type === "Task";
        if (isOverATask) {
            const overTaskIndex = newTasks.findIndex((t) => t.id === overId);
            if (newTasks[activeTaskIndex].status !== newTasks[overTaskIndex].status) {
                newTasks[activeTaskIndex].status = newTasks[overTaskIndex].status;
                return { ...board, tasks: arrayMove(newTasks, activeTaskIndex, overTaskIndex) };
            }
            return { ...board, tasks: arrayMove(newTasks, activeTaskIndex, overTaskIndex) };
        }

        const isOverAColumn = over.data.current?.type === "Column";
        if (isOverAColumn) {
            if (newTasks[activeTaskIndex].status !== overId) {
                newTasks[activeTaskIndex].status = overId as TaskStatus;
                // Important: we need to return a new array for React to detect the change
                return { ...board, tasks: arrayMove(newTasks, activeTaskIndex, activeTaskIndex) };
            }
        }
        return board;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const previousBoardData = boardData;
    setActiveTask(null);

    const { active, over } = event;
    if (!over || active.id === over.id || !previousBoardData) return;

    const finalTasksByStatus = previousBoardData.tasks.reduce((acc, task) => {
        (acc[task.status] = acc[task.status] || []).push(task);
        return acc;
    }, {} as Record<TaskStatus, TaskWithAssignee[]>);

    const tasksToUpdate: {id: string; position: number; status: TaskStatus}[] = [];
    Object.values(finalTasksByStatus).forEach(columnTasks => {
        columnTasks.forEach((task, index) => {
            tasksToUpdate.push({ id: task.id, position: index, status: task.status });
        });
    });

    try {
        if (tasksToUpdate.length > 0) {
          const response = await fetch('/api/tasks/update-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasksToUpdate),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save changes.");
          }
          toast.success( "Board updated successfully!" );
        }
    } catch (error: any) {
        toast.error(
           "Could not save task arrangement. Please refresh.",
        );
        setBoardData(previousBoardData);
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!boardData) return;
    const previousBoardData = { ...boardData };
    setBoardData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
        };
    });

    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error("Failed to update task");
        toast.success("Task updated successfully!" );
        fetchBoardData();
    } catch (error) {
        toast.error("Update Failed" );
        setBoardData(previousBoardData);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-foreground">Loading Board...</div>;
  }
  if (!boardData) {
    return <div className="flex h-full items-center justify-center text-destructive">Failed to load project data.</div>;
  }

  return (
    <ProjectContext.Provider value={{ workspaceId: boardData.workspaceId, projectId }}>

    <div className="p-4 md:p-6 h-full flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between mb-4 pb-2 border-b">
        <h1 className="text-2xl font-bold">{boardData.name} Board</h1>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-md">
            <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setViewMode('board')}
                className={cn( "flex items-center gap-2 px-3", viewMode === 'board' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground' )}
            >
                <LayoutGrid className="h-4 w-4" />
                Board
            </Button>
            <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setViewMode('table')}
                className={cn( "flex items-center gap-2 px-3", viewMode === 'table' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground' )}
            >
                <List className="h-4 w-4" />
                Table
            </Button>
        </div>
      </header>
        
      {viewMode === 'board' ? (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            collisionDetection={closestCorners}
        >
            <main className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto">
                {BOARD_COLUMNS.map((col) => (
                <KanbanColumn
                    key={col.status}
                    column={col}
                    tasks={tasksByStatus[col.status] || []}
                    projectId={projectId}
                    currentUserId={currentUserId}
                    members={boardData.members}
                    onTaskCreated={fetchBoardData}
                />
                ))}
            </main>
            {createPortal(
                <DragOverlay>
                    {activeTask ? (
                      <div className="shadow-2xl rounded-lg transform scale-105">
                        <SortableTaskCard task={activeTask} isOverlay />
                      </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
      ) : (
        <main className="flex-1 overflow-y-auto">
            <ProjectTable 
                tasks={boardData.tasks} 
                onTaskUpdate={handleTaskUpdate}
            />
        </main>
      )}
    </div>
    </ProjectContext.Provider>

  );
}