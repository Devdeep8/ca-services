'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useTransition } from "react";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// 1. Import the server action and the schema
import { updateProfile } from '@/actions/user';
import { UpdateProfileSchema } from "./schemas";
export default function EditProfileForm({ profileId }: { profileId: string }) {
  // 2. A transition hook to manage the server action's pending state
  const [isPending, startTransition] = useTransition();

  // 3. Define the form using `react-hook-form` and `zod`
  const form = useForm<z.infer<typeof UpdateProfileSchema>>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: "",
    },
  })

  // 4. Define a submit handler to call the server action
  function onSubmit(values: z.infer<typeof UpdateProfileSchema>) {
    startTransition(async () => {
      const result = await updateProfile(profileId, values);

      if (result?.success) {
        toast.success("Success", { description: result.success });
      } else if (result?.error) {
        toast.error("Error", { description: result.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 5. Build the form using shadcn/ui's <Form> component */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} disabled={isPending} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}