import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useVerifyEmail } from './use-verify-email';

export function VerifyEmailPage() {
  const verifyEmail = useVerifyEmail();

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Verify your email</CardTitle>
          {verifyEmail.status === 'verifying' && (
            <CardDescription>Confirming your email address…</CardDescription>
          )}
          {verifyEmail.status === 'verified' && (
            <CardDescription>Your email is verified - you can sign in now.</CardDescription>
          )}
          {verifyEmail.status === 'failed' && (
            <CardDescription>
              That link is invalid or has expired. Request a new one below.
            </CardDescription>
          )}
          {verifyEmail.status === 'idle' && (
            <CardDescription>
              {verifyEmail.sentTo
                ? `We sent a verification link to ${verifyEmail.sentTo}. Open it to finish setting up your account.`
                : 'Enter your email to receive a verification link.'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {verifyEmail.status === 'verified' ? (
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
                  value={verifyEmail.email}
                  onChange={(e) => verifyEmail.setEmail(e.target.value)}
                />
              </div>
              <Button
                onClick={verifyEmail.handleResend}
                disabled={verifyEmail.isResending || !verifyEmail.email}
              >
                {verifyEmail.isResending ? 'Sending…' : 'Resend verification email'}
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
