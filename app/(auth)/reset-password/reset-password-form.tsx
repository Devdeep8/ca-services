'use client';

import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


// 1. Define the validation schema with Zod
const ResetPasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Show the error on the confirm password field
});

type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // 2. Handle form submission
  const onSubmit = (data: ResetPasswordFormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        // Replace with your actual API endpoint for resetting the password
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            password: data.password,
          }),
        });
        
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Something went wrong.');
        }
        
        setSuccess('Your password has been reset successfully!');

        toast.success('Password updated! You can now log in.');
        window.location.href = '/login';
        form.reset();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  // If the user has already successfully reset, don't show the form
  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Success</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">{success}</p>
        </CardContent>
      </Card>
    );
  }

  // If there's no token in the URL, show an error message
  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Invalid password reset link. The link may have expired or is incorrect.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Your Password</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}