import AuthCallbackClient from '@/components/AuthCallbackClient';
import { Suspense } from 'react';

export const metadata = {
  title: 'Confirmation email · BuildrAI',
};

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="container auth-container auth-callback-pending">
          <p>Confirmation en cours…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
