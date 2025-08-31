'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTransition } from "react";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// 👇 Import your new PasswordInput component
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Info } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChangePasswordSchema, passwordRules } from "@/components/profile-module/schemas";
import { changePassword } from "@/actions/user";

export default function ChangePasswordForm({ profileId }: { profileId: string }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof ChangePasswordSchema>) {
    startTransition(async () => {
      const result = await changePassword(profileId, values);
      if (result?.success) {
        toast.success("Password Changed!", { description: result.success });
        form.reset();
      } else if (result?.error) {
        toast.error("An Error Occurred", { description: result.error });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          For your security, we recommend using a long and unique password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Password Field */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    {/* 👇 Use PasswordInput instead of Input */}
                    <PasswordInput {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* New Password Field */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-x-2">
                    <FormLabel>New Password</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" type="button" className="h-5 w-5 rounded-full">
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Password must contain:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {passwordRules.map((rule, index) => (
                              <li key={index}>{rule}</li>
                            ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormControl>
                    {/* 👇 Use PasswordInput instead of Input */}
                    <PasswordInput {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Confirm New Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    {/* 👇 Use PasswordInput instead of Input */}
                    <PasswordInput {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}