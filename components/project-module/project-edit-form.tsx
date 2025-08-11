// components/project-edit-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Project, User, ProjectMember as ProjectMemberWithUser, ProjectRole } from '@prisma/client';
import { toast } from 'sonner';
import { X, UserPlus } from 'lucide-react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

// Define types for props
type ProjectWithMembers = Project & { members: (ProjectMemberWithUser & { user: User })[] };
type FormUser = Pick<User, 'id' | 'name' | 'email'>;

// Define the form validation schema using Zod
const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH' , 'URGENT']),
  createdBy: z.string().cuid("Creator is required"),
  members: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    role: z.nativeEnum(ProjectRole),
  })),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export function ProjectEditForm({ initialProject, allUsers }: { initialProject: ProjectWithMembers; allUsers: FormUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialProject.name,
      description: initialProject.description ?? '',
      status: initialProject.status,
      priority: initialProject.priority,
      createdBy: initialProject.createdBy,
      members: initialProject.members.map(m => ({
        userId: m.user.id,
        name: m.user.name ?? '',
        role: m.role,
      })),
    },
  });

  const watchMembers = watch('members');

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
        members: data.members.map(({ userId, role }) => ({ userId, role })), // API expects a simpler object
      };

      const response = await fetch(`/api/data/projects/${initialProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Project updated successfully!');
        router.push(`/projects/${initialProject.id}`); // Or wherever you want to redirect
        router.refresh(); // Refresh server components
      } else {
        const errorData = await response.json();
        toast.error('Failed to update project.', {
          description: errorData.message || 'An unknown error occurred.',
        });
      }
    });
  };

  console.log('initialProject', initialProject , allUsers);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Fields */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status and Priority Selects go here, similar to Creator */}
      </div>

      {/* Members Management */}
      <div>
        <h3 className="text-lg font-medium mb-2">Project Members</h3>
        <div className="space-y-3 rounded-md border p-4">
          {watchMembers.map((member, index) => (
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

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}