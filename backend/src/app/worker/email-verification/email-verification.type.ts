import { JobInput } from '../worker.type';

export type EmailVerificationData = {
  email: string;
  firstName: string;
  token: string;
};
export type EmailVerificationRawPayload = JobInput<EmailVerificationData>;
