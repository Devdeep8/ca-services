"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

// Define simple types for the data we'll fetch
interface Department {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface CreateProjectModalProps {
  workspaceId: string;
  onProjectCreated?: (newProject: any) => void;
}

export function CreateProjectModal({
  workspaceId,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // The error state is no longer needed as sonner will handle it
  // const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- STATE FOR FORM FIELDS ---
  const [projectName, setProjectName] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [isClient, setIsClient] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // --- STATE FOR DATA FETCHED FROM API ---
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // --- FETCH DEPARTMENTS AND CLIENTS WHEN MODAL OPENS ---
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [deptRes, clientRes] = await Promise.all([
            fetch("/api/departments"),
            fetch("/api/get/users?userType=CLIENT"),
          ]);

          if (!deptRes.ok || !clientRes.ok) {
            throw new Error("Failed to load required data for the form.");
          }

          const departmentsData = await deptRes.json();
          const usersData = await clientRes.json();

          setDepartments(departmentsData || []);
          setClients(usersData || []);
        } catch (err: any) {
            // You can still show a toast for data fetching errors
            toast.error(err.message || "Failed to fetch initial data.");
        }
      };

      fetchData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setProjectName("");
    setSelectedDepartmentId("");
    setIsClient(false);
    setSelectedClientId("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsOpen(open);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectName || isLoading) return;

    if (isClient && (!selectedClientId || selectedClientId === 'null')) {
      toast.error("Please select a client for this project.");
      return;
    }

    if (!selectedDepartmentId) {
    toast.error("Please select a department for this project.");
    return;
  }

    setIsLoading(true);

    const payload = {
      name: projectName,
      workspaceId,
      departmentId: selectedDepartmentId ,
      // isClient,
      // clientId: isClient ? selectedClientId : null,
    };
    // --- USE TOAST.PROMISE FOR SUBMISSION ---
    toast.promise(
      fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          // Throw an error to be caught by the toast's error handler
          throw new Error(errorData.error || "Failed to create project.");
        }
        return response.json();
      }),
      {
        loading: "Creating project...",
        success: (data) => {
          handleOpenChange(false); // Close modal and reset form on success
          if (onProjectCreated) {
            onProjectCreated(data.project);
          } else {
            router.refresh();
          }
          setIsLoading(false);
          return `Project "${data.project.name}" created successfully!`;
        },
        error: (err) => {
          setIsLoading(false);
          // The error message comes from the Error thrown in the promise
          return err.message;
        },
      }
    );
  };

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Project
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new project</DialogTitle>
            <DialogDescription>
              Fill in the details for your new project to get started.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* --- PROJECT NAME INPUT --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Q4 Marketing Campaign"
                  required
                />
              </div>

              {/* --- DEPARTMENT SELECT --- */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <Select
                  onValueChange={setSelectedDepartmentId}
                  value={selectedDepartmentId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* --- IS CLIENT PROJECT SWITCH --- */}
              {/* <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="is-client">Client Project</Label>
                  <p className="text-xs text-muted-foreground">
                    Is this project for an external client?
                  </p>
                </div>
                <Switch
                  id="is-client"
                  checked={isClient}
                  onCheckedChange={setIsClient}
                />
              </div> */}

              {/* --- CLIENT SELECT (Conditional) --- */}
              {/* {isClient && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">
                    Client
                  </Label>
                  <Select
                    onValueChange={setSelectedClientId}
                    value={selectedClientId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length > 0 ? (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="null" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )} */}
              {/* The old error message display is no longer needed */}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
