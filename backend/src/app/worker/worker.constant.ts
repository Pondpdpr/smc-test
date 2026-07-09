import { values } from 'remeda';

export const DOMAIN_EVENT_QUEUES = {
  SAMPLE: { name: 'sample' },
} as const;

export const CRON_QUEUES = {
  CLEAN_UP: { name: 'cleanup' },
} as const;

export const EMAIL_VERIFICATION_QUEUES = {
  SEND: { name: 'send' },
} as const;

export const MQ_EXCHANGE = {
  DOMAIN_EVENT: {
    name: 'domain-event',
    queues: values(DOMAIN_EVENT_QUEUES),
  },
  CRON: {
    name: 'cron',
    queues: values(CRON_QUEUES),
  },
  EMAIL_VERIFICATION: {
    name: 'email-verification',
    queues: values(EMAIL_VERIFICATION_QUEUES),
  },
} as const satisfies Record<string, ExchangeConfig>;

export type MQ_EXCHANGE = (typeof MQ_EXCHANGE)[keyof typeof MQ_EXCHANGE];

export type QueueConfig = {
  name: string;
  config?: {
    disableConsumer?: boolean;
    retry?: {
      // default false
      disable?: boolean;
      backOffMilliSeconds?: number;
    };
  };
};
export type ExchangeConfig = {
  name: string;
  queues: QueueConfig[];
};
