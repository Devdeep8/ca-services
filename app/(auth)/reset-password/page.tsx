import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

// This is a Server Component.
export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Suspense fallback={<div className="text-center">Loading form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}