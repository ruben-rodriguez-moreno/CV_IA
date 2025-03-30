'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || '';
  
  useEffect(() => {
    // Redirect to /register, preserving the plan parameter if it exists
    const redirectUrl = plan ? `/register?plan=${plan}` : '/register';
    router.replace(redirectUrl);
  }, [router, plan]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to registration page...</p>
    </div>
  );
}