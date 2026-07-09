import { JobInput } from '../worker.type';

export type SampleRawPayload = JobInput<{ key: string }>;
export type SampleData = { key: string };
