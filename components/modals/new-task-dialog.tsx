'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { type ProjectMember, type User, type TaskStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

// Import all required components from shadcn/ui
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';

type MemberWithUser = ProjectMember & { user: User };

const formSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.date().optional(),
  assigneeId: z.string().optional(),
});

interface NewTaskDialogProps {
  projectId: string;
  status: TaskStatus; // Receives the status directly
  reporterId: string;
  members: MemberWithUser[];
  onTaskCreated: () => void;
  children: React.ReactNode;
}

export function NewTaskDialog({
  projectId,
  status,
  reporterId,
  members,
  onTaskCreated,
  children,
}: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const payload = { ...values, status, reporterId, projectId };
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      form.reset();
      onTaskCreated();
      setOpen(false);
    } catch (error) {
      console.error(error);
      // You can add a user-facing error message here (e.g., using a Toast)
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>Add a new card to {status.replace('_', ' ')}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Card title</FormLabel><FormControl><Input placeholder="e.g., Finalize Q3 budget report" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description (optional)</FormLabel><FormControl><Textarea placeholder="Add more details..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="assigneeId" render={({ field }) => (
                <FormItem><FormLabel>Assign to</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger></FormControl>
                        <SelectContent>{members.map(mem => <SelectItem key={mem.userId} value={mem.userId}>{mem.user.name}</SelectItem>)}</SelectContent>
                    </Select>
                <FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel className='mb-1.5'>Due Date</FormLabel>
                  <Popover><PopoverTrigger asChild><FormControl>
                    <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl></PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                  </PopoverContent></Popover><FormMessage /></FormItem>
              )}/>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Card'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}