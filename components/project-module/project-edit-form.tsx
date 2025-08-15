// components/project-edit-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Project, User, Department, ProjectMember as ProjectMemberWithUser, ProjectRole, ProjectStatus, Priority } from '@prisma/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { X, UserPlus, Calendar as CalendarIcon } from 'lucide-react';

// Import local utilities and shadcn/ui components
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';

// --- TYPE DEFINITIONS ---
type DropdownDepartment = Pick<Department, 'id' | 'name'>;
type FormUser = Pick<User, 'id' | 'name' | 'email'>;

// This type now includes the department relation for displaying the current department
type ProjectWithDetails = Project & { 
    members: (ProjectMemberWithUser & { user: User })[];
    department: Department | null; 
};

// --- ZOD VALIDATION SCHEMA ---
const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  startDate: z.date().nullable().optional(),
  dueDate: z.date().nullable().optional(),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(Priority),
  createdBy: z.string().cuid("Creator is required"),
  departmentId: z.string().cuid("Invalid department ID").nullable().optional(), // Added departmentId
  members: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    role: z.nativeEnum(ProjectRole),
  })),
})
.refine(data => {
  if (data.dueDate) {
    if (!data.startDate) return false;
    return data.dueDate >= data.startDate;
  }
  return true;
}, {
  message: "A start date is required and must be before the due date.",
  path: ["dueDate"], 
})
.refine(data => {
    if (data.dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return data.dueDate >= today;
    }
    return true;
}, {
    message: "Due date cannot be in the past.",
    path: ["dueDate"],
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

// --- COMPONENT PROPS ---
interface ProjectEditFormProps {
    initialProject: ProjectWithDetails;
    allUsers: FormUser[];
    departments: DropdownDepartment[]; // Departments are now passed as a prop
}

export function ProjectEditForm({ initialProject, allUsers, departments }: ProjectEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialProject.name,
      description: initialProject.description ?? '',
      startDate: initialProject.startDate ? new Date(initialProject.startDate) : null,
      dueDate: initialProject.dueDate ? new Date(initialProject.dueDate) : null,
      status: initialProject.status,
      priority: initialProject.priority,
      createdBy: initialProject.createdBy,
      departmentId: initialProject.departmentId ?? undefined, // Set default department
      members: initialProject.members.map(m => ({
        userId: m.user.id,
        name: m.user.name ?? '',
        role: m.role,
      })),
    },
  });

  const [startDate, dueDate, watchMembers] = watch(['startDate', 'dueDate', 'members']);

  const calculateDuration = () => {
    if (startDate && dueDate && dueDate >= startDate) {
      const days = differenceInDays(dueDate, startDate) + 1;
      return `${days} day(s)`;
    }
    return null;
  };

  const addMember = (user: FormUser) => {
    if (!watchMembers.some(m => m.userId === user.id)) {
      setValue('members', [...watchMembers, { userId: user.id, name: user.name ?? '', role: 'MEMBER' }]);
    }
  };

  const removeMember = (userId: string) => {
    setValue('members', watchMembers.filter(m => m.userId !== userId));
  };

  const updateMemberRole = (userId: string, role: ProjectRole) => {
    setValue('members', watchMembers.map(m => (m.userId === userId ? { ...m, role } : m)));
  };

  const onSubmit = (data: ProjectFormData) => {
    startTransition(async () => {
      const payload = {
        ...data,
        members: data.members.map(({ userId, role }) => ({ userId, role })),
      };

      const response = await fetch(`/api/data/projects/${initialProject.id}`, { // Ensure this API endpoint is correct
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Project updated successfully!');
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error('Failed to update project.', {
          description: errorData.message || 'An unknown error occurred.',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* --- BASIC FIELDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="createdBy">Project Lead / Creator</Label>
          <Controller
            name="createdBy"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={4} />
      </div>

      {/* --- STATUS, PRIORITY, DEPARTMENT --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Controller
            name="status"
            control={control}
            render={({ field }) => (
                <div>
                    <Label>Status</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.values(ProjectStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
        />
        <Controller
            name="priority"
            control={control}
            render={({ field }) => (
                <div>
                    <Label>Priority</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.values(Priority).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
        />
        <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
                <div>
                    <Label>Department</Label>
                    {/* FIX: Handle "none" value to set field to null */}
                    <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                        defaultValue={field.value ?? ""}
                    >
                        <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                        <SelectContent>
                            {/* FIX: Use a non-empty string for the "None" option */}
                            <SelectItem value="none">None</SelectItem>
                            {departments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
        />
      </div>

      {/* --- DATE PICKERS & DURATION --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Start Date Controller */}
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus /></PopoverContent>
              </Popover>
            </div>
          )}
        />
        {/* Due Date Controller */}
        <Controller
          name="dueDate"
          control={control}
          render={({ field }) => (
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} disabled={(date) => startDate ? date < startDate : false} initialFocus /></PopoverContent>
              </Popover>
              {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>}
            </div>
          )}
        />
      </div>
      <div className="text-sm text-muted-foreground -mt-4">
        {calculateDuration() && <p><strong>Duration:</strong> {calculateDuration()}</p>}
      </div>
      
      {/* --- MEMBERS MANAGEMENT --- */}
      <div>
        <h3 className="text-lg font-medium mb-2">Project Members</h3>
        <div className="space-y-3 rounded-md border p-4">
          {watchMembers.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-2">
              <span className="font-medium">{member.name}</span>
              <div className="flex items-center gap-2">
                <Select value={member.role} onValueChange={(role) => updateMemberRole(member.userId, role as ProjectRole)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(member.userId)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {watchMembers.length === 0 && <p className="text-sm text-muted-foreground">No members assigned.</p>}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="mt-4">
              <UserPlus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {allUsers
                    .filter(user => !watchMembers.some(m => m.userId === user.id))
                    .map(user => (
                      <CommandItem key={user.id} onSelect={() => addMember(user)}>
                        {user.name} ({user.email})
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* --- SUBMIT BUTTON --- */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
