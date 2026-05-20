'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@coastal/shared-ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get('error') === 'unauthorized';
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        setError('Could not establish session. Please try again.');
        return;
      }
      router.replace('/today');
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4 p-6 bg-card rounded-lg border">
      <h1 className="text-xl font-semibold">Coastal Ops</h1>
      <p className="text-sm text-muted-foreground">Sign in to continue.</p>
      {unauthorized && (
        <div className="text-sm text-destructive">
          Access denied. This account is not authorized.
        </div>
      )}
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={pending}
        className="w-full"
      >
        {pending ? 'Signing in...' : 'Sign in with Google'}
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
