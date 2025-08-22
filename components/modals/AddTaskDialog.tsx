// /components/modals/AddTaskDialog.tsx

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Your types and schemas
import { Project, User, Priority, TaskStatus} from '@/types';
import { taskFormSchema , TaskFormData , TaskFormInput} from '@/lib/zod';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// --- Props Interface ---
interface TaskFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
}

// --- Type for the API response needed by the form ---
interface FormContextData {
  projects: Project[];
  currentUser: User;
}

// --- SWR Fetcher Function ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Main Dialog Component ---
export function TaskFormDialog({ isOpen, onOpenChange, onSubmit }: TaskFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetches data only when the dialog is open
  const { data: formContextData, error, isLoading } = useSWR<FormContextData>(
    isOpen ? `/api/tasks/form-context` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const form = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
      startDate: new Date(), // Set start date to today by default
    },
  });

  const projects = formContextData?.projects || [];
  const currentUser = formContextData?.currentUser;
  const watchedProjectId = form.watch('projectId');

  useEffect(() => {
    if (!formContextData) return;

    const selectedProject = projects.find(p => p.id === watchedProjectId);
    
    if (selectedProject && currentUser) {
      const projectUsers = selectedProject.members.map(member => member.user);
      const projectLead = selectedProject.members.find(m => m.role === 'LEAD')?.user;

      // Set default column to the first in the list

      
      // Set default reporter and assignee
      form.setValue('reporterId', projectLead?.id || '');
      const isCurrentUserMember = projectUsers.some(user => user.id === currentUser.id);
      form.setValue('assigneeId', isCurrentUserMember ? currentUser.id : undefined);
    } else {
      // Reset dependent fields if no project is selected
      form.resetField('reporterId');
      form.resetField('assigneeId');
    }
  }, [watchedProjectId, projects, currentUser, form, formContextData]);

  const handleFormSubmit = async (data: TaskFormInput) => {
    setIsSubmitting(true);
    try {
      const parsedData = taskFormSchema.parse(data);
      await onSubmit(parsedData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
        
        {isLoading && <FormSkeleton />}
        {error && <div className='p-4 text-center text-red-500'>Failed to load form data. Please try again.</div>}

        {!isLoading && !error && formContextData && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="space-y-4">
                <FormField name="title" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input placeholder="e.g., Finalize Q4 budget report" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="projectId" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger></FormControl>
                        <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  
                 
                </div>
                
                <FormField name="description" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Add extra details..." rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="assigneeId" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedProjectId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select an assignee" /></SelectTrigger></FormControl>
                        <SelectContent>{(selectedProject => selectedProject ? selectedProject.members.map(m => <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>) : null)(projects.find(p => p.id === watchedProjectId))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>

                  <FormField name="reporterId" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reporter *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={!watchedProjectId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a reporter" /></SelectTrigger></FormControl>
                        <SelectContent>{(selectedProject => selectedProject ? selectedProject.members.map(m => <SelectItem key={m.user.id} value={m.user.id}>{m.user.name}</SelectItem>) : null)(projects.find(p => p.id === watchedProjectId))}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="priority" control={form.control} render={({ field }) => (
                       <FormItem>
                        <FormLabel>Priority</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                           <SelectContent>
                            {Object.values(Priority).map(p => <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>)}
                           </SelectContent>
                         </Select>
                       </FormItem>
                    )}/>
                    
                    <FormField name="estimatedHours" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="4"
                            onChange={(event) => field.onChange(event.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            min={0}
                            step="0.1"
                            inputMode="decimal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
  name="startDate" 
  control={form.control} 
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Start Date</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button 
              variant="outline" 
              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
            >
              {/* FIX: Cast field.value to Date for the format function */}
              {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* FIX: Cast field.value for the selected prop */}
          <Calendar 
            mode="single" 
            selected={field.value as Date | undefined} 
            onSelect={field.onChange} 
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
<FormField 
  name="dueDate" 
  control={form.control} 
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Due Date</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button 
              variant="outline" 
              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
            >
              {/* FIX: Cast field.value to Date for the format function */}
              {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {/* FIX: Cast field.value for the selected prop */}
          <Calendar 
            mode="single" 
            selected={field.value as Date | undefined} 
            onSelect={field.onChange} 
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
                 </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Skeleton Loader Component ---
const FormSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
);