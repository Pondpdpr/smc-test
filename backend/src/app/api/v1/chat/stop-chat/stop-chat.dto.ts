import { IStandardResponse } from '@/shared/type/type.http';

export type StopChatResponse = IStandardResponse<{
  stopped: boolean;
}>;
