'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { InviteMemberDialog } from '@/components/modals/invite-member-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


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
                    <p className="text-zinc-400">Manage who has access to this workspace.</p>
                </div>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite member
                </Button>
            </header>

            <div className="border border-zinc-700 rounded-lg bg-zinc-800/30">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-700 hover:bg-transparent">
                            <TableHead className="w-[40%]">Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined / Invited</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24">Loading members...</TableCell></TableRow>
                        ) : (
                            members.map((item) => (
                                <TableRow key={item.id} className="border-zinc-800">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={item.avatar || ''} />
                                                <AvatarFallback>{item.email.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{item.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{item.role}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {item.status === 'Active' ? 
                                                // --- UPDATED CLASS ---
                                                <CheckCircle2 className="h-4 w-4 text-success" /> : 
                                                // --- UPDATED CLASS ---
                                                <Clock className="h-4 w-4 text-warning" />
                                            }
                                            {item.status}
                                        </div>
                                    </TableCell>
                                    <TableCell>{format(new Date(item.joined), 'PP')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <InviteMemberDialog 
                workspaceId={workspaceId}
                open={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
                onInviteSent={fetchMembers} // Refresh list after sending
            />
        </div>
    );
}