import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useResendVerificationMutation, useVerifyEmailMutation } from '@/shared/api/auth/auth.hook';

export type VerifyEmailStatus = 'verifying' | 'verified' | 'failed' | 'idle';

export function useVerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const sentTo = searchParams.get('sent');
  const resendTo = searchParams.get('resend');

  const [status, setStatus] = useState<VerifyEmailStatus>(token ? 'verifying' : 'idle');
  const [email, setEmail] = useState(sentTo ?? resendTo ?? '');
  // Destructured: only `mutate` is stable across renders, unlike the whole
  // result object - depending on that would re-run this effect needlessly.
  const { mutateAsync: verifyEmail } = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();

  // Guards the single-use token against React 18 StrictMode's double-invoke.
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!token || hasAttemptedRef.current) {
      return;
    }
    hasAttemptedRef.current = true;

    // mutate(token, {onSuccess/onError}) never fired its callbacks here
    // (reproduced live) - mutateAsync + .then/.catch does.
    verifyEmail(token)
      .then(() => setStatus('verified'))
      .catch(() => setStatus('failed'));
  }, [token, verifyEmail]);

  async function handleResend() {
    if (!email) {
      return;
    }
    try {
      await resendMutation.mutateAsync(email);
      toast.success('If that email exists, a new verification link is on its way.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not resend the email');
    }
  }

  return {
    status,
    email,
    setEmail,
    sentTo,
    handleResend,
    isResending: resendMutation.isPending,
  };
}
