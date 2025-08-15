'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {  UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { InviteMemberDialog } from '@/components/modals/invite-member-dialog';
import { format } from 'date-fns';


// Define the type for the combined list from our API
type MemberListItem = {
    type: 'member' | 'invitation';
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role: string;
    status: 'Active' | 'Pending';
    joined: string;
    department    : string | null;
};


export default function MembersPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    
    const [members, setMembers] = useState<MemberListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    const fetchMembers = async () => {
        if (!workspaceId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/members`);
            if (!response.ok) throw new Error("Failed to fetch members");
            const data = await response.json();
            setMembers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [workspaceId]);

    return (
  <div className="p-4 md:p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage who has access to this workspace.</p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite member
        </Button>
      </header>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Member</TableHead>
              <TableHead className="w-[20%]">Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined / Invited</TableHead>
              {/* <TableHead className="text-right">Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Loading members...
                </TableCell>
              </TableRow>
            ) : (
              members.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.avatar || ""} />
                        <AvatarFallback>
                          {item.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{item.name ?? item.email}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {item.department ? (
                      item.department
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{item.role}</Badge>
                  </TableCell>

                  {/* --- UPDATED STATUS CELL FOR BOTH MODES --- */}
                  <TableCell>
                    {item.status === "Active" ? (
                      <Badge variant="outline" className="text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20">
                        <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>{format(new Date(item.joined), "PP")}</TableCell>

                  {/* <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell> */}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* <InviteMemberDialog
        workspaceId={workspaceId}
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInviteSent={fetchMembers}
      /> 
      */}

  <InviteMemberDialog
    workspaceId={workspaceId}
    open={isInviteDialogOpen}
    onOpenChange={setIsInviteDialogOpen}
    onInviteSent={fetchMembers} // Refresh list after sending
  />
</div>
    );
}