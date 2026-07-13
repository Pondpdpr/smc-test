import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">{children}</Card>
    </div>
  );
}
