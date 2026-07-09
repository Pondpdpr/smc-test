import { Provider } from '@nestjs/common';

import { DomainEventQueue } from './domain-event/domain-event.queue';
import { EmailVerificationQueue } from './email-verification/email-verification.queue';

export const QUEUE_PROVIDER: Provider[] = [
  //
  DomainEventQueue,
  EmailVerificationQueue,
];
