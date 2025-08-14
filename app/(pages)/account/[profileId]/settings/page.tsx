"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Department = {
  id: string;
  name: string;
};

// We can add a type for the user profile as well
type UserProfile = {
    id: string;
    name: string | null;
    email: string | null;
    departmentId: string | null;
}

export default function SettingsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // This one useEffect now handles all initial data fetching
  useEffect(() => {
    const fetchPageData = async () => {
      setIsLoading(true);
      try {
        // Fetch both endpoints concurrently for better performance
        const [departmentsResponse, profileResponse] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/profile'),
        ]);

        if (!departmentsResponse.ok) {
          throw new Error('Failed to fetch departments.');
        }
        if (!profileResponse.ok) {
            throw new Error('Failed to fetch user profile.');
        }

        const departmentsData: Department[] = await departmentsResponse.json();
        const profileData: UserProfile = await profileResponse.json();

        // Set the list of departments for the dropdown
        setDepartments(departmentsData);

        // KEY FIX: Set the selected department based on the user's profile
        if (profileData.departmentId) {
            setSelectedDepartment(profileData.departmentId);
        }

      } catch (error) {
        toast.error("Could not load your settings. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDepartment) {
      toast.error("Please select a department before saving.");
      return;
    }

    setIsSaving(true);
    try {
      // Your API endpoint to UPDATE the department should probably be more specific
      const response = await fetch('/api/profile', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: selectedDepartment }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update your department.');
      }
      
      toast.success("Your department has been updated successfully.");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <form onSubmit={handleSubmit}>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="department">Department</Label>
                {isLoading ? (
                  <p>Loading settings...</p> // Updated loading text
                ) : (
                  <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}