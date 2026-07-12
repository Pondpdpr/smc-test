import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/shared/api/auth/auth.hook';

type Status = 'verifying' | 'verified' | 'failed' | 'idle';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const sentTo = searchParams.get('sent');
  const resendTo = searchParams.get('resend');

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'idle');
  const [email, setEmail] = useState(sentTo ?? resendTo ?? '');
  // Destructured because `mutate` is the stable piece - the mutation result
  // object itself is a new reference every render, so depending on that
  // instead would defeat the hasAttemptedRef guard below by re-running the
  // effect on unrelated re-renders.
  const { mutateAsync: verifyEmail } = useVerifyEmailMutation();
  const resendMutation = useResendVerificationMutation();

  // Tokens are single-use, so this call must never run twice for the same
  // token - React 18 StrictMode double-invokes effects in dev, which would
  // otherwise consume the token on the first call and then stomp the
  // success state with 'failed' when the second call rejects.
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (!token || hasAttemptedRef.current) {
      return;
    }
    hasAttemptedRef.current = true;

    // mutateAsync + .then/.catch, not mutate(token, {onSuccess, onError}) -
    // the callback-options form of mutate() was observed to silently never
    // fire its callbacks when called from inside this effect (reproduced
    // live: the network request completed successfully but neither
    // onSuccess nor onError ran, leaving the page stuck on "Confirming...").
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

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Verify your email</CardTitle>
          {status === 'verifying' && <CardDescription>Confirming your email address…</CardDescription>}
          {status === 'verified' && (
            <CardDescription>Your email is verified - you can sign in now.</CardDescription>
          )}
          {status === 'failed' && (
            <CardDescription>
              That link is invalid or has expired. Request a new one below.
            </CardDescription>
          )}
          {status === 'idle' && (
            <CardDescription>
              {sentTo
                ? `We sent a verification link to ${sentTo}. Open it to finish setting up your account.`
                : 'Enter your email to receive a verification link.'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === 'verified' ? (
            <Button render={<Link to="/login" />} nativeButton={false}>
              Go to sign in
            </Button>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="resend-email">Email</Label>
                <Input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleResend} disabled={resendMutation.isPending || !email}>
                {resendMutation.isPending ? 'Sending…' : 'Resend verification email'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
